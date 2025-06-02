/**
 * 連絡先追加モーダルコンポーネント
 * ステップフォームを使用して連絡先を追加するためのモーダルを提供します
 */
import { Modal } from '@/ui/modal/components/Modal';

import { AddPersonModalContent } from './AddPersonModalContent';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPersonModal({ isOpen, onClose }: AddPersonModalProps) {
  return (
    <Modal isOpen={isOpen}>
      <AddPersonModalContent onClose={onClose} />
    </Modal>
  );
}
