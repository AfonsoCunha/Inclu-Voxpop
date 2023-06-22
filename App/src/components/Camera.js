import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { locations } from "../data/locations";
import SelectLocationModal from "./SelectLocationModal";
import UnlockAudioModal from "./UnlockAudioModal"
import { Button } from "react-bootstrap";
import { getRecognitionData, loadRecognitionModel, initializeModel } from "../utils/recognition";
import { fetchAudio } from "../utils/fetchAudio";
import * as tf from "@tensorflow/tfjs";
import privacyPolicyImage from "../images/privacy-policy.svg";
import { Howl } from 'howler';

function Camera({ setErrorMessage }) {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showUnlockAudioModal, setShowUnlockAudioModal] = useState(false);
  const location = locations.find((loc) => loc.id === parseInt(id));
  const [selectedLocation, setSelectedLocation] = useState(location);
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const recognitionModel = useRef({
    model: undefined,
    locationId: undefined,
    views: undefined,
    items: undefined,
    zones: undefined,
  });
  const silentAudio = new Audio()
  silentAudio.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='


  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSelect = (location) => {
    setSelectedLocation(location);
    setCameraActive(false);
    setShowModal(false);
    if (selectedLocation.id !== location.id) {
      videoRef.current.srcObject.getTracks()[0].stop();
    }
    navigate(`/camera/${location.id}`);
  };

  const handleChangeLocationClick = () => {
    setShowModal(true);
  };

  const handleAudioUnlockClick = () => {
    setShowUnlockAudioModal(false);
  };

  useEffect(() => {
    function launchCamera() {
      return new Promise((resolve, reject) => {
        function launchCameraIfPortrait() {
          setTimeout(function () {
            if (window.innerHeight / window.innerWidth > 1) {
              window.removeEventListener("orientationchange", launchCameraIfPortrait);
              resolve(launchCamera());
              setErrorMessage("");
            }
          }, 1500);
        }

        if (window.innerHeight / window.innerWidth > 1) {
          async function calculateCameraStreamConstraints() {
            return new Promise((resolve, reject) => {
              let aspectRatio = window.innerWidth / window.innerHeight;
              let streamWidth = Math.max(window.innerWidth, 224);

              let streamHeight = streamWidth / aspectRatio;

              let constraints = {
                audio: false,
                video: {
                  facingMode: "environment",
                  width: streamWidth,
                  height: streamHeight,
                  zoom: 1,
                  deviceId: "",
                },
              };

              navigator.mediaDevices
                .enumerateDevices()
                .then((devices) => {
                  let environmentVideoCameras = devices.filter(
                    (device) => device.kind === "videoinput" && device.label.includes("back")
                  );
                  if (environmentVideoCameras.length > 1) {
                    let camera;
                    let cameraClosestToTarget;

                    function getCameraCapabilities(camera) {
                      constraints.video.deviceId = camera.deviceId;

                      navigator.mediaDevices
                        .getUserMedia(constraints)
                        .then(function (stream) {
                          let capabilities = stream.getVideoTracks()[0].getCapabilities();
                          stream.getTracks()[0].stop();
                          let zoomRangeError = Math.abs(capabilities.zoom.max - capabilities.zoom.min - 10);
                          if (cameraClosestToTarget) {
                            if (cameraClosestToTarget.zoomRangeError > zoomRangeError) {
                              cameraClosestToTarget = {
                                deviceId: camera.deviceId,
                                zoomRangeError: zoomRangeError,
                              };
                            }
                          } else {
                            cameraClosestToTarget = {
                              deviceId: camera.deviceId,
                              zoomRangeError: zoomRangeError,
                            };
                          }
                          if (environmentVideoCameras.length > 0) {
                            camera = environmentVideoCameras.pop();
                            getCameraCapabilities(camera);
                          } else {
                            resolve({
                              audio: false,
                              video: {
                                facingMode: "environment",
                                width: streamHeight,
                                height: streamWidth,
                                zoom: 1,
                                deviceId: cameraClosestToTarget.deviceId,
                              },
                            });
                          }
                        })
                        .catch(function (err) {
                          console.log(err);
                          resolve({
                            audio: false,
                            video: {
                              facingMode: "environment",
                              width: streamHeight,
                              height: streamWidth,
                              zoom: 1,
                              deviceId: "",
                            },
                          });
                        });
                    }
                    camera = environmentVideoCameras.pop();
                    getCameraCapabilities(camera);
                  } else {
                    resolve({
                      audio: false,
                      video: {
                        facingMode: "environment",
                        width: streamHeight,
                        height: streamWidth,
                        zoom: 1,
                        deviceId: "",
                      },
                    });
                  }
                })
                .catch(function (err) {
                  resolve({
                    audio: false,
                    video: {
                      facingMode: "environment",
                      width: streamHeight,
                      height: streamWidth,
                      zoom: 1,
                      deviceId: "",
                    },
                  });
                });
            });
          }

          setTimeout(async function () {
            let constraints = await calculateCameraStreamConstraints();
            console.log(constraints);
            // Provide a minimum and maximum width/height range because if I set very specific ideal dimensions the stream is glitchy in some phones
            constraints["video"]["width"] = {
              min: Math.round(constraints["video"]["width"]),
              max: Math.round(constraints["video"]["width"] * 2),
            };
            constraints["video"]["height"] = {
              min: Math.round(constraints["video"]["height"]),
              max: Math.round(constraints["video"]["height"] * 2),
            };

            navigator.mediaDevices
              .getUserMedia(constraints)
              .then((stream) => {
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;

                  videoRef.current.setAttribute("autoplay", "");
                  videoRef.current.setAttribute("muted", "");
                  videoRef.current.setAttribute("playsinline", "");
                  videoRef.current.style.position = "absolute";

                  // This timeout is necessary because otherwise stream.getVideoTracks()[0].getSettings().width
                  setTimeout(() => {
                    let vw, vh; // display css width, height
                    const streamAspectRatio =
                      stream.getVideoTracks()[0].getSettings().width / stream.getVideoTracks()[0].getSettings().height;
                    const windowAspectRatio = window.innerWidth / window.innerHeight;
                    if (streamAspectRatio > windowAspectRatio) {
                      vh = window.innerHeight;
                      vw = vh * streamAspectRatio;
                    } else {
                      vw = window.innerWidth;
                      vh = vw / streamAspectRatio;
                    }
                    videoRef.current.style.zIndex = "-2";
                    videoRef.current.style.top = -(vh - window.innerHeight) / 2 + "px";
                    videoRef.current.style.left = -(vw - window.innerWidth) / 2 + "px";
                    videoRef.current.style.width = vw + "px";
                    videoRef.current.style.height = vh + "px";
                  });

                  videoRef.current.onloadedmetadata = function (e) {
                    videoRef.current.setAttribute("width", videoRef.current.videoWidth);
                    videoRef.current.setAttribute("height", videoRef.current.videoHeight);
                    videoRef.current.play();
                  };
                  setCameraActive(true);
                  resolve(stream);
                }
              })
              .catch((error) => {
                reject(error);
              });
          }, 1000);
        } else {
          window.addEventListener("orientationchange", launchCameraIfPortrait);
          setErrorMessage("Por favor rode o seu dispositivo para iniciar a câmera.");
        }
      });
    }

    async function startRecognition(model, stream) {
      function preProcessFrame(videoStreamWidth, videoStreamHeight) {
        const videoWidth = parseFloat(videoRef.current.style.width);
        const videoHeight = parseFloat(videoRef.current.style.height);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = 224;
        canvas.height = 224;

        let xStream = ((0 + Math.abs(parseFloat(videoRef.current.style.left))) * videoStreamWidth) / videoWidth;
        let yStream = (((window.innerHeight - window.innerWidth) / 2) * videoStreamHeight) / videoHeight;
        let lStream = (Math.max(window.innerWidth, 224) * videoStreamWidth) / videoWidth;

        context.drawImage(videoRef.current, xStream, yStream, lStream, lStream, 0, 0, 224, 224);

        return canvas;
      }

      async function performInference(preProcessedFrame) {
        return new Promise(async (resolve, reject) => {
          const prediction = tf.tidy(() => {
            const pixels = tf.browser.fromPixels(preProcessedFrame);
            const batchedImage = pixels.expandDims(0);
            try {
              return tf.tidy(() => model.model.predict(batchedImage.toFloat()));
            } catch (runModelError) {
              reject(runModelError);
            }
          });

          let index;
          let probability;

          try {
            await prediction.data().then((result) => {
              probability = Math.max(...result);
              index = result.indexOf(probability);
            });
          } catch (err) {
            reject(err);
          }
          prediction.dispose();
          let predictedItem = model.recognitionTargets[index];
          if (probability > selectedLocation.recognitionThreshold && !predictedItem.startsWith("0-")) {
            resolve(predictedItem);
          } else {
            resolve(null);
          }
        });
      }

      function getItemFromRecognitionTarget(prediction) {
        if (prediction in model.views) {
          return [model.views[prediction].type, model.views[prediction].id];
        }
        return [null, null];
      }

      function getAppropriateItemOrZone(itemType, itemId, previousZone) {
        if (itemType === "item") {
          if (model.items[itemId].zoneId) {
            if (previousZone && previousZone === model.items[itemId].zoneId) {
              return ["item", itemId, false];
            } else {
              return ["zone", model.items[itemId].zoneId, true];
            }
          } else {
            return ["item", itemId, false];
          }
        } else if (itemType === "zone" && itemId !== previousZone) {
          return ["zone", itemId, false];
        } else {
          return [null, null, false];
        }
      }

      const requiredNumberOfPredictions = 4;
      let lastPredictions = new Array(requiredNumberOfPredictions).fill(null);
      const allElementsInArrayAreEqual = (arr) => arr.every((v) => v !== null && v === arr[0]);
      let previousPrediction;
      let previousZone;
      let previousContentForItemWasZone = false;
      let audio;

      while (recognitionModel.current.locationId === selectedLocation.id) {
        // Only perform inference if device is in portrait mode
        // Only perform inference if the audio for a zone that was obtained by scanning a item contained in that zone is no longer playing,
        // in order to avoid immediately superimposing the item audio over the zone audio
        if (window.innerHeight / window.innerWidth > 1 && (!previousContentForItemWasZone || (audio && !audio.playing()))) {
          let preProcessedFrame = preProcessFrame(
            stream.getVideoTracks()[0].getSettings().width,
            stream.getVideoTracks()[0].getSettings().height
          );
          // console.log(preProcessedFrame.toDataURL('image/jpeg'))
          let prediction = await performInference(preProcessedFrame);
          if (prediction) {
            if (previousContentForItemWasZone) {
              lastPredictions.pop();
              lastPredictions.unshift(prediction);
              if (allElementsInArrayAreEqual(lastPredictions)) {
                previousPrediction = prediction;
                lastPredictions.fill(null);
                let [itemType, itemId] = getItemFromRecognitionTarget(prediction);
                [itemType, itemId, previousContentForItemWasZone] = getAppropriateItemOrZone(
                  itemType,
                  itemId,
                  previousZone
                );
                if (itemType) {
                  if (itemType === "zone") {
                    previousZone = itemId;
                  }
                  try {
                    let audioUrl = await fetchAudio(selectedLocation.id, itemType, itemId);
                    if (audio) {
                      console.log("Stopping previous audio")
                      audio.stop();
                    }
                    audio = new Howl({
                      src: [audioUrl],
                      preload: true,
                      html5: true,
                      onend: () => { audio.unload(); }
                    });
                    audio.play();
                  } catch (err) {
                    console.log(err);
                  }
                }
              }
            } else {
              lastPredictions.pop();
              lastPredictions.unshift(prediction);
              if (
                allElementsInArrayAreEqual(lastPredictions) &&
                (prediction !== previousPrediction || !previousPrediction)
              ) {
                previousPrediction = prediction;
                lastPredictions.fill(null);
                let [itemType, itemId] = getItemFromRecognitionTarget(prediction);
                [itemType, itemId, previousContentForItemWasZone] = getAppropriateItemOrZone(
                  itemType,
                  itemId,
                  previousZone
                );
                if (itemType) {
                  if (itemType === "zone") {
                    previousZone = itemId;
                  }
                  try {
                    let audioUrl = await fetchAudio(selectedLocation.id, itemType, itemId);
                    audio = new Howl({
                      src: [audioUrl],
                      preload: true,
                      html5: true,
                      onend: () => { audio.unload(); }
                    });
                    audio.play();
                  } catch (err) {
                    console.log(err);
                  }
                }
              }
            }
          }
        }

        // Wait for next frame
        await tf.nextFrame();
      }
    }

    setIsLoading(true);

    launchCamera()
      .then(async (stream) => {
        try {
          let [recognitionTargets, views, items, zones] = await getRecognitionData(selectedLocation.id);
          recognitionModel.current.model = await loadRecognitionModel(selectedLocation.id);
          recognitionModel.current.locationId = selectedLocation.id;
          recognitionModel.current.recognitionTargets = recognitionTargets;
          recognitionModel.current.views = views;
          recognitionModel.current.items = items;
          recognitionModel.current.zones = zones;
          let audioUnlocked = true;

          const playPromise = silentAudio.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
            }).catch(error => {
              audioUnlocked = false;
            });
          }

          await initializeModel(recognitionModel.current.model);
          setIsLoading(false);
          startRecognition(recognitionModel.current, stream);
          if (!audioUnlocked) {
            setShowUnlockAudioModal(true)
          }
          
        } catch (error) {
          setErrorMessage(error);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
        setErrorMessage("A câmara não está disponível. Por favor permita o acesso à câmara e recarregue a app.");
        setIsLoading(false);
      });
  }, [selectedLocation]);

  return (
    <div>
      <div className="position-absolute horizontal-center text-center p-2 mt-2 location-div">
        {selectedLocation && <h1>{selectedLocation.name}</h1>}
        <Button
          className="change-location-button"
          variant="primary"
          disabled={isLoading}
          onClick={handleChangeLocationClick}
        >
          Alterar localização
        </Button>
        <SelectLocationModal show={showModal} handleClose={handleModalClose} handleSelect={handleModalSelect} />
        <UnlockAudioModal show={showUnlockAudioModal} handleClose={handleAudioUnlockClick} handleClick={handleAudioUnlockClick} ></UnlockAudioModal>
      </div>
      {isLoading && <div className="position-absolute loader center"></div>}
      {cameraActive && (
        <div className="camera-banner">
          <h1 className="camera-banner-text">Por favor rode o dispositivo</h1>
        </div>
      )}
      <div className="camera-div">
        <video ref={videoRef} />
      </div>
      <a
        color="primary"
        className="privacy-policy-btn"
        onClick={() => {
          navigate("/privacy-policy");
        }}
      >
        <img src={privacyPolicyImage} alt="Política de Privacidade" />
      </a>
    </div>
  );
}

export default Camera;
