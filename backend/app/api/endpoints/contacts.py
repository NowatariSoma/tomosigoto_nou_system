from app.api.deps import get_contact_service, get_current_user
from app.schemas.current_user import CurrentUser
from app.schemas.contacts import ContactCreate, ContactResponse
from app.services.contact_service import ContactService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.post("/", response_model=ContactResponse)
def create_contact(
    contact_data: ContactCreate,
    current_user: CurrentUser = Depends(get_current_user),
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    新しいお問い合わせを作成

    Args:
        contact_data: 作成するお問い合わせ情報
        current_user: 現在のログインユーザー
        contact_service: ContactServiceインスタンス

    Returns:
        作成されたお問い合わせ情報
    """
    contact_dict = contact_data.model_dump()
    # 認証済みユーザーのIDを設定（リクエストボディのuser_idは無視）
    contact_dict["user_id"] = current_user["id"]
    created_contact = contact_service.create_contact(contact_dict)
    return ContactResponse(**created_contact)

