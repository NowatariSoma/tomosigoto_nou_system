/**
 * 人を追加・編集するためのコンテンツコンポーネント
 * フィルター定義を使用して動的にフォームを生成します
 * モーダルまたは右サイドパネルで使用可能
 */
import { useCallback, useMemo } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { getOperationName } from '@apollo/client/utilities';
import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';

import { GET_PEOPLE } from '@/people/queries';
import { MainButton } from '@/ui/button/components/MainButton';
import { FilterDefinition } from '@/ui/filter-n-sort/types/FilterDefinition';
import { FilterDefinitionByEntity } from '@/ui/filter-n-sort/types/FilterDefinitionByEntity';
import { TextInput } from '@/ui/input/components/TextInput';
import { useSnackBar } from '@/ui/snack-bar/hooks/useSnackBar';
import {
  InsertPersonMutationVariables,
  Person,
  useInsertPersonMutation,
  useUpdatePeopleMutation,
} from '~/generated/graphql';
import { peopleFilters } from '~/pages/people/people-filters';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const StyledButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(4)};
  width: 100%;

  /* ボタンが小さい画面でも適切に表示されるように調整 */
  @media (max-width: 400px) {
    justify-content: center;
  }
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledSectionTitle = styled.h3`
  color: ${({ theme }) => theme.font.color.light};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin: 0;
`;

// フィールドをセクションでグループ化する定義
interface FieldSection {
  title: string;
  fields: FilterDefinitionByEntity<Person>[];
}

// フィールドセクションの定義
const fieldSections: FieldSection[] = [
  {
    title: '基本情報',
    fields: peopleFilters.filter((filter: FilterDefinitionByEntity<Person>) =>
      ['firstName', 'lastName'].includes(filter.field as string),
    ),
  },
  {
    title: '連絡先情報',
    fields: peopleFilters.filter((filter: FilterDefinitionByEntity<Person>) =>
      ['email', 'phone'].includes(filter.field as string),
    ),
  },
  {
    title: '所在地・所属情報',
    fields: peopleFilters.filter((filter: FilterDefinitionByEntity<Person>) =>
      ['city', 'companyId'].includes(filter.field as string),
    ),
  },
];

// 必須フィールドの定義
const requiredFields = ['firstName', 'lastName'];

/**
 * フォーム初期データ型定義
 */
interface PersonFormData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  // 必要に応じて他のフィールドも追加
}

interface AddPersonModalContentProps {
  onClose: () => void;
  initialData?: PersonFormData;
}

export function AddPersonModalContent({
  onClose,
  initialData,
}: AddPersonModalContentProps) {
  const { enqueueSnackBar } = useSnackBar();
  const [insertPersonMutation] = useInsertPersonMutation();
  const [updatePeopleMutation] = useUpdatePeopleMutation();

  // 編集モードかどうかを判定
  const isEditMode = !!initialData;

  // 動的にバリデーションスキーマを生成
  const validationSchema = useMemo(() => {
    const schemaFields: Record<string, any> = {};

    peopleFilters.forEach((filter: FilterDefinitionByEntity<Person>) => {
      const fieldName = filter.field as string;
      let fieldSchema = Yup.string();

      if (requiredFields.includes(fieldName)) {
        fieldSchema = fieldSchema.required(`${filter.label}を入力してください`);
      }

      if (fieldName === 'email') {
        fieldSchema = fieldSchema.email(
          '有効なメールアドレスを入力してください',
        );
      }

      schemaFields[fieldName] = fieldSchema;
    });

    return Yup.object().shape(schemaFields);
  }, []);

  // フォーム設定
  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<Record<string, string>>({
    mode: 'onChange',
    resolver: yupResolver(validationSchema),
    defaultValues: useMemo(() => {
      const defaultValues: Record<string, string> = {};

      // デフォルト値を初期化
      peopleFilters.forEach((filter: FilterDefinitionByEntity<Person>) => {
        defaultValues[filter.field as string] = '';
      });

      // 初期データがある場合は上書き
      if (initialData) {
        Object.entries(initialData).forEach(([key, value]) => {
          if (value !== undefined) {
            defaultValues[key] = value;
          }
        });
      }

      return defaultValues;
    }, [initialData]),
  });

  // 送信ハンドラー
  const onSubmit: SubmitHandler<Record<string, string>> = useCallback(
    async (data) => {
      try {
        if (isEditMode && initialData && initialData.id) {
          // 更新モード
          await updatePeopleMutation({
            variables: {
              id: initialData.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone || '',
              city: data.city || '',
            },
            refetchQueries: [getOperationName(GET_PEOPLE) ?? ''],
            awaitRefetchQueries: true,
          });

          enqueueSnackBar('連絡先が正常に更新されました', {
            variant: 'success',
          });
        } else {
          // 新規作成モード
          const variables: InsertPersonMutationVariables = {
            id: uuidv4(),
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            createdAt: new Date().toISOString(),
          };

          await insertPersonMutation({
            variables,
            refetchQueries: [getOperationName(GET_PEOPLE) ?? ''],
            awaitRefetchQueries: true,
          });

          enqueueSnackBar('連絡先が正常に追加されました', {
            variant: 'success',
          });
        }

        onClose();
      } catch (error: any) {
        enqueueSnackBar(error?.message || '操作中にエラーが発生しました', {
          variant: 'error',
        });
      }
    },
    [
      insertPersonMutation,
      updatePeopleMutation,
      enqueueSnackBar,
      onClose,
      isEditMode,
      initialData,
    ],
  );

  // フィールドを動的にレンダリング
  const renderField = useCallback(
    (filter: FilterDefinitionByEntity<Person>) => {
      const fieldName = filter.field as string;
      const isRequired = requiredFields.includes(fieldName);

      return (
        <Controller
          key={fieldName}
          name={fieldName}
          control={control}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <TextInput
              label={`${filter.label}${isRequired ? '' : '（任意）'}`}
              value={value}
              onBlur={onBlur}
              onChange={onChange}
              placeholder={filter.label}
              error={error?.message}
              fullWidth
            />
          )}
        />
      );
    },
    [control],
  );

  return (
    <StyledContainer>
      {fieldSections.map((section) => (
        <StyledSection key={section.title}>
          <StyledSectionTitle>{section.title}</StyledSectionTitle>
          {section.fields.map(renderField)}
        </StyledSection>
      ))}

      <StyledButtonContainer>
        <MainButton
          title="キャンセル"
          onClick={onClose}
          variant="secondary"
          style={{ minWidth: '90px', maxWidth: '140px' }}
        />
        <MainButton
          title={isEditMode ? '保存' : '追加'}
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
          style={{ minWidth: '90px', maxWidth: '140px' }}
        />
      </StyledButtonContainer>
    </StyledContainer>
  );
}
