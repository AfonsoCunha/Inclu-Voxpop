import { Modal, Button } from "react-bootstrap";

function UnlockAudioModal({ show, handleClose, handleClick }) {
    return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>O dispositivo está a bloquear o áudio automático.</Modal.Title>
      </Modal.Header>
      <Modal.Body>
          <Button
            variant="primary"
            className="mb-2 w-100"
            onClick={() => handleClick()}
          >
            Clique para ativar
          </Button>
      </Modal.Body>
    </Modal>
  );
}

export default UnlockAudioModal;