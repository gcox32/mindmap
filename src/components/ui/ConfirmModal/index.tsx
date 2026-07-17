import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import './ConfirmModal.css'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const SPRING_GENTLE = { type: 'spring', stiffness: 300, damping: 28 } as const
const TAP_TRANSITION = { duration: 0.15 }

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="confirm-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TAP_TRANSITION}
          onClick={onCancel}
        >
          <motion.div
            className="panel confirm-modal"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={SPRING_GENTLE}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-modal-title">{title}</h3>
            <p className="confirm-modal-message">{message}</p>
            <div className="confirm-modal-actions">
              <motion.button
                type="button"
                className="text-btn"
                onClick={onCancel}
                whileTap={{ scale: 0.9 }}
                transition={TAP_TRANSITION}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                className="primary-btn primary-btn--danger"
                onClick={onConfirm}
                disabled={busy}
                whileTap={{ scale: 0.9 }}
                transition={TAP_TRANSITION}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
