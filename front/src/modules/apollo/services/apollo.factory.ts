/**
 * @fileoverview Apolloクライアント工場クラス
 * Apolloクライアントのインスタンスを作成・管理します
 */
/* eslint-disable no-loop-func */
import {
  ApolloClient,
  ApolloClientOptions,
  ApolloLink,
  ServerError,
  ServerParseError,
} from '@apollo/client';
import { GraphQLErrors } from '@apollo/client/errors';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
// @ts-ignore apollo-upload-clientの型定義の問題を無視する
import { createUploadLink } from 'apollo-upload-client';

import { renewToken } from '@/auth/services/AuthService';
import { AuthTokenPair } from '~/generated/graphql';
import { assertNotNull } from '~/utils/assert';

import { ApolloManager } from '../types/apolloManager.interface';
import { loggerLink } from '../utils';

const logger = loggerLink(() => 'Twenty');

let isRefreshing = false;

/**
 * Apolloクライアントのオプション
 * @typedef {Object} Options
 * @template TCacheShape キャッシュの形状
 */
export interface Options<TCacheShape> extends ApolloClientOptions<TCacheShape> {
  /** GraphQLエラー発生時のコールバック */
  onError?: (err: GraphQLErrors | undefined) => void;
  /** ネットワークエラー発生時のコールバック */
  onNetworkError?: (err: Error | ServerParseError | ServerError) => void;
  /** トークンペア変更時のコールバック */
  onTokenPairChange?: (tokenPair: AuthTokenPair) => void;
  /** 認証エラー発生時のコールバック */
  onUnauthenticatedError?: () => void;
  /** 初期トークンペア */
  initialTokenPair: AuthTokenPair | null;
  /** 追加のApolloリンク */
  extraLinks?: ApolloLink[];
  /** デバッグモードフラグ */
  isDebugMode?: boolean;
}

/**
 * Apolloクライアント工場クラス
 * @class ApolloFactory
 * @template TCacheShape キャッシュの形状
 * @implements {ApolloManager<TCacheShape>}
 */
export class ApolloFactory<TCacheShape> implements ApolloManager<TCacheShape> {
  private client: ApolloClient<TCacheShape>;
  private tokenPair: AuthTokenPair | null = null;

  /**
   * コンストラクタ
   * @param {Options<TCacheShape>} opts - Apolloクライアントのオプション
   */
  constructor(opts: Options<TCacheShape>) {
    const {
      uri,
      onError: onErrorCb,
      onNetworkError,
      onTokenPairChange,
      onUnauthenticatedError,
      initialTokenPair,
      extraLinks,
      isDebugMode,
      ...options
    } = opts;

    this.tokenPair = initialTokenPair;

    /**
     * Apolloリンクを構築する
     * @returns {ApolloLink} 構築されたApolloリンク
     */
    const buildApolloLink = (): ApolloLink => {
      // @ts-ignore apollo-upload-clientの型定義の問題を無視する
      const httpLink = createUploadLink({
        uri,
      });

      const authLink = setContext(async (_, { headers }) => {
        return {
          headers: {
            ...headers,
            authorization: this.tokenPair?.accessToken.token
              ? `Bearer ${this.tokenPair?.accessToken.token}`
              : '',
          },
        };
      });

      const retryLink = new RetryLink({
        delay: {
          initial: 100,
        },
        attempts: {
          max: 2,
          retryIf: (error) => !!error,
        },
      });

      const errorLink = onError(
        ({ graphQLErrors, networkError, forward, operation }) => {
          if (graphQLErrors) {
            onErrorCb?.(graphQLErrors);

            for (const graphQLError of graphQLErrors) {
              switch (graphQLError?.extensions?.code) {
                case 'UNAUTHENTICATED': {
                  if (!isRefreshing) {
                    isRefreshing = true;
                    renewToken(uri, this.tokenPair)
                      .then((tokens) => {
                        onTokenPairChange?.(tokens);
                        return true;
                      })
                      .catch(() => {
                        onUnauthenticatedError?.();
                        return false;
                      })
                      .finally(() => {
                        isRefreshing = false;
                      });
                  }
                  return forward(operation);
                }
                default:
                  if (isDebugMode) {
                    console.warn(
                      `[GraphQL error]: Message: ${
                        graphQLError.message
                      }, Location: ${
                        graphQLError.locations
                          ? JSON.stringify(graphQLError.locations)
                          : graphQLError.locations
                      }, Path: ${graphQLError.path}`,
                    );
                  }
              }
            }
          }

          if (networkError) {
            if (isDebugMode) {
              console.warn(`[Network error]: ${networkError}`);
            }
            onNetworkError?.(networkError);
          }
        },
      );

      // @ts-ignore apollo-upload-clientとApolloLinkの型定義の不一致を無視
      return ApolloLink.from(
        [
          errorLink,
          authLink,
          ...(extraLinks ? extraLinks : []),
          isDebugMode ? logger : null,
          retryLink,
          httpLink,
        ].filter(assertNotNull),
      );
    };

    this.client = new ApolloClient({
      ...options,
      link: buildApolloLink(),
    });
  }

  /**
   * トークンペアを更新する
   * @param {AuthTokenPair | null} tokenPair - 新しいトークンペア
   */
  updateTokenPair(tokenPair: AuthTokenPair | null) {
    this.tokenPair = tokenPair;
  }

  /**
   * Apolloクライアントを取得する
   * @returns {ApolloClient<TCacheShape>} Apolloクライアントインスタンス
   */
  getClient() {
    return this.client;
  }
}
