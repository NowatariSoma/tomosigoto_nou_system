from app.api.deps import get_contact_service
from app.schemas.contacts import ContactCreate, ContactResponse
from app.services.contact_service import ContactService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.post("/", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    新しいお問い合わせを作成

    Args:
        contact_data: 作成するお問い合わせ情報
        contact_service: ContactServiceインスタンス

    Returns:
        作成されたお問い合わせ情報
    """
    contact_dict = contact_data.model_dump()
    created_contact = await contact_service.create_contact(contact_dict)
    return ContactResponse(**created_contact)

