import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePosition } from "../hooks/usePosition";
import { calcDistance } from "../utils/calcDistance";
import { locations } from "../data/locations";
import SelectLocationModal from "./SelectLocationModal";

function Home() {
  const navigate = useNavigate();
  const { latitude, longitude } = usePosition();
  const [showModal, setShowModal] = useState(false);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSelect = (location) => {
    navigate(`/camera/${location.id}`);
  };

  useEffect(() => {
    if (latitude && longitude) {
      const distances = locations.map((location) => {
        const { latitude: locLat, longitude: locLon } = location;
        const distance = calcDistance(
          { latitude, longitude },
          { latitude: locLat, longitude: locLon }
        );
        return { locationId: location.id, distance };
      });
      distances.sort((a, b) => a.distance - b.distance);
      console.log(distances)
      if (distances[0].distance < 500) {
        navigate(`/camera/${distances[0].locationId}`);
      } else {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  }, [latitude, longitude]);

  return (
    <>
      <SelectLocationModal
        show={showModal}
        handleClose={handleModalClose}
        handleSelect={handleModalSelect}
      />
    </>
  );
}

export default Home;
