import { Modal, Button } from "react-bootstrap";
import { locations } from "../data/locations";

function SelectLocationModal({ show, handleClose, handleSelect }) {
    return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>Escolha um local</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {locations.map((location) => (
          <Button
            key={location.name}
            variant="primary"
            className="mb-2 w-100"
            onClick={() => handleSelect(location)}
          >
            {location.name}
          </Button>
        ))}
      </Modal.Body>
    </Modal>
  );
}

export default SelectLocationModal;