/**
 * 人物詳細を表示する右サイドパネルコンポーネント
 * 詳細情報の表示と編集機能を統合して提供します
 */
import { ReactNode, useCallback, useState } from 'react';
import { Control, Controller, useForm } from 'react-hook-form';
import { getOperationName } from '@apollo/client/utilities';
import styled from '@emotion/styled';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { GET_PEOPLE } from '@/people/queries';
import { MainButton } from '@/ui/button/components/MainButton';
import { PropertyBox } from '@/ui/editable-field/property-box/components/PropertyBox';
import { PropertyBoxItem } from '@/ui/editable-field/property-box/components/PropertyBoxItem';
import {
  IconBuildingSkyscraper,
  IconLink,
  IconMail,
  IconMap,
  IconPhone,
  IconUser,
} from '@/ui/icon/index';
import { TextInput } from '@/ui/input/components/TextInput';
import { RightDrawerBody } from '@/ui/right-drawer/components/RightDrawerBody';
import { RightDrawerPage } from '@/ui/right-drawer/components/RightDrawerPage';
import { RightDrawerTopBar } from '@/ui/right-drawer/components/RightDrawerTopBar';
import { isRightDrawerOpenState } from '@/ui/right-drawer/states/isRightDrawerOpenState';
import { useSnackBar } from '@/ui/snack-bar/hooks/useSnackBar';
import { useGetPersonQuery } from '~/generated/graphql';
import { CommentableType, useUpdatePeopleMutation } from '~/generated/graphql';
import { selectedPersonIdState } from '~/modules/ui/right-drawer/states/selectedPersonIdState';

import { AddPersonModalContent } from '../../components/AddPersonModalContent';

import { HiddenScrollTimeline } from './HiddenScrollTimeline';

/**
 * 下部のドラッグハンドルを非表示にするためのカスタムRightDrawerBody
 */
const StyledRightDrawerBody = styled(RightDrawerBody)`
  /* 下部のドラッグハンドルを非表示にする */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; /* IE, Edge 対応 */
  scrollbar-width: none; /* Firefox 対応 */
  width: 100%;
`;

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  height: 100%;
  padding: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const StyledSummaryCard = styled.div`
  background-color: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const StyledName = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
`;

const StyledDate = styled.div`
  color: ${({ theme }) => theme.font.color.light};
  font-size: ${({ theme }) => theme.font.size.xs};
`;

const StyledTimelineSection = styled.div`
  flex: 1;
  min-height: 300px;
  overflow: visible;
  width: 100%;
`;

// 編集可能なPropertyBoxItem用のスタイル
const StyledEditableField = styled.div`
  margin-left: ${({ theme }) => theme.spacing(2)};
  width: 100%;
`;

// 保存ボタン用のコンテナ
const StyledButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

// フォームデータの型定義
interface PersonFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
}

/**
 * 編集可能なPropertyBoxItemコンポーネントのプロパティ
 */
interface EditablePropertyBoxItemProps {
  icon: ReactNode;
  label: string;
  name: keyof PersonFormData;
  control: Control<PersonFormData>;
  required?: boolean;
}

/**
 * 編集可能なPropertyBoxItemコンポーネント
 */
function EditablePropertyBoxItem({
  icon,
  label,
  name,
  control,
  required = false,
}: EditablePropertyBoxItemProps) {
  return (
    <PropertyBoxItem
      icon={icon}
      label={label}
      value={
        <Controller
          name={name}
          control={control}
          rules={{ required }}
          render={({ field, fieldState: { error } }) => (
            <StyledEditableField>
              <TextInput
                {...field}
                placeholder={`${label}を入力`}
                error={error?.message}
                fullWidth
              />
            </StyledEditableField>
          )}
        />
      }
    />
  );
}

export function RightDrawerPersonDetail() {
  const [, setIsRightDrawerOpen] = useRecoilState(isRightDrawerOpenState);
  const selectedPersonId = useRecoilValue(selectedPersonIdState);
  const { enqueueSnackBar } = useSnackBar();
  const [updatePeopleMutation] = useUpdatePeopleMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data } = useGetPersonQuery({
    variables: { id: selectedPersonId || '' },
    skip: !selectedPersonId,
  });
  const person = data?.findUniquePerson;

  const handleClose = useCallback(() => {
    setIsRightDrawerOpen(false);
  }, [setIsRightDrawerOpen]);

  // 新規作成モードかどうかを判定
  const isCreateMode = !selectedPersonId;

  // フォーム設定
  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<PersonFormData>({
    defaultValues: {
      firstName: person?.firstName || '',
      lastName: person?.lastName || '',
      email: person?.email || '',
      phone: '', // 現在のAPIで取得していないフィールド
      city: '', // 現在のAPIで取得していないフィールド
    },
    mode: 'onChange',
  });

  // 保存ハンドラー
  const onSubmit = useCallback(
    async (formData: PersonFormData) => {
      try {
        setIsSubmitting(true);

        if (person?.id) {
          // 更新モード
          await updatePeopleMutation({
            variables: {
              id: person.id,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              // APIが対応していれば以下も送信する
              // phone: formData.phone,
              // city: formData.city,
            },
            refetchQueries: [getOperationName(GET_PEOPLE) ?? ''],
            awaitRefetchQueries: true,
          });

          enqueueSnackBar('連絡先情報が更新されました', {
            variant: 'success',
          });
        }

        setIsSubmitting(false);
      } catch (error) {
        enqueueSnackBar('更新中にエラーが発生しました', {
          variant: 'error',
        });
        setIsSubmitting(false);
      }
    },
    [person, updatePeopleMutation, enqueueSnackBar],
  );

  // 新規作成モードの場合はAddPersonModalContentを表示
  if (isCreateMode) {
    return (
      <RightDrawerPage>
        <RightDrawerTopBar title="連絡先を追加" />
        <StyledRightDrawerBody>
          <AddPersonModalContent onClose={handleClose} />
        </StyledRightDrawerBody>
      </RightDrawerPage>
    );
  }

  // 詳細表示モードで、personが取得できていない場合
  if (!person) {
    return null;
  }

  return (
    <RightDrawerPage>
      <RightDrawerTopBar
        title={`${person.firstName || ''} ${person.lastName || ''}`}
      />
      <StyledRightDrawerBody>
        <StyledContainer>
          <StyledSummaryCard>
            <StyledName>{person.displayName || 'No name'}</StyledName>
            <StyledDate>
              作成日: {new Date(person.createdAt).toLocaleDateString()}
            </StyledDate>
          </StyledSummaryCard>

          <form onSubmit={handleSubmit(onSubmit)}>
            <PropertyBox extraPadding={true}>
              <>
                <EditablePropertyBoxItem
                  icon={<IconUser />}
                  label="名"
                  name="firstName"
                  control={control}
                  required={true}
                />
                <EditablePropertyBoxItem
                  icon={<IconUser />}
                  label="姓"
                  name="lastName"
                  control={control}
                  required={true}
                />
                <EditablePropertyBoxItem
                  icon={<IconMail />}
                  label="メール"
                  name="email"
                  control={control}
                />
                <EditablePropertyBoxItem
                  icon={<IconPhone />}
                  label="電話番号"
                  name="phone"
                  control={control}
                />
                <EditablePropertyBoxItem
                  icon={<IconMap />}
                  label="都市"
                  name="city"
                  control={control}
                />
                <PropertyBoxItem
                  icon={<IconBuildingSkyscraper />}
                  label="会社"
                  value={person.company?.id ? '会社あり' : '未設定'}
                />
              </>
            </PropertyBox>

            <StyledButtonContainer>
              <MainButton
                title="保存"
                type="submit"
                disabled={!isDirty || !isValid || isSubmitting}
              />
            </StyledButtonContainer>
          </form>

          <StyledTimelineSection>
            <HiddenScrollTimeline
              entity={{ id: person.id, type: CommentableType.Person }}
            />
          </StyledTimelineSection>
        </StyledContainer>
      </StyledRightDrawerBody>
    </RightDrawerPage>
  );
}
