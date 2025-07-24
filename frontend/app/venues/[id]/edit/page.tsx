import { VenueFormView } from '@/src/features/venues/views/VenueFormView';

interface EditVenuePageProps {
  params: {
    id: string;
  };
}

export default function EditVenuePage({ params }: EditVenuePageProps) {
  const venueId = parseInt(params.id);

  if (isNaN(venueId)) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
          <p className="text-muted-foreground">
            無効な会場IDです。
          </p>
        </div>
      </div>
    );
  }

  return (
    <VenueFormView
      venueId={venueId}
      onSaveComplete={(venueId) => {
        console.log('Venue updated with ID:', venueId);
        // ここで適切なリダイレクトやナビゲーションを行う
      }}
    />
  );
}