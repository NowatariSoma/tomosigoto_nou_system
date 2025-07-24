import { VenueFormView } from '@/src/features/venues/views/VenueFormView';

export default function NewVenuePage() {
  return (
    <VenueFormView
      onSaveComplete={(venueId) => {
        console.log('Venue saved with ID:', venueId);
        // ここで適切なリダイレクトやナビゲーションを行う
      }}
    />
  );
}