import React from "react";
import ReactDOM from "react-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import * as tf from "@tensorflow/tfjs";
// import { loadGraphModel, load } from "@tensorflow/tfjs-converter";
import "./styles.css";

import "bootstrap/dist/css/bootstrap.min.css";
tf.setBackend("webgl");

// const threshold = 0.35;
const threshold = 0.75;

async function load_model() {
  // tf.load
  // It's possible to load the model locally or from a repo
  // You can choose whatever IP and PORT you want in the "http://127.0.0.1:8080/model.json" just set it before in your https server
  // const model = await loadGraphModel("http://localhost:51196/model.json");

  const model = await tf.loadGraphModel("http://127.0.0.1:8080/model.json");

  // const model = Object.freeze(await tf.loadGraphModel("http://127.0.0.1:8080/model.json"));
  // console.log('harr');
  // const model = await loadGraphModel("http://127.0.0.1:3000/model/kangaroo-detector/model.json");
  // const model = await tf.loadGraphModel(
  //   "https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json"
  // );

  // const model = await tf.loadGraphModel(
  //   "https://raw.githubusercontent.com/itsmitchyyy/itsmitchyyy.github.io/main/ar-playground/another_model/model.json"
  // );
  // const model = await tf.loadGraphModel('https://raw.githubusercontent.com/junrezapico/hello-world-tensorflow/main/models/rubick-2k-steps/model.json');
  return model;
}

// let classesDir = {
//   1: {
//     name: "Kangaroo",
//     id: 1,
//   },
//   2: {
//     name: "Other",
//     id: 2,
//   },
// };
let classesDir = {
  1: {
    // name: "rubicks",
    name: "rubick",
    id: 1,
  },
  2: {
    name: "Other",
    id: 2,
  },
};

const videoConstraints = {
  width: "100vw",
  height: "100vh",
};

const ReusableModal = ({ show, handleClose }) => {
  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
      </Modal>
    </>
  );
};

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();
  state = {
    isModalOpen: false,
  };

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            // facingMode: { exact: "environment" }
            // facingMode: 'environment'
          },
        })
        .then((stream) => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        })
        .catch((err) => {
          console.log("error", err);
        });

      const modelPromise = load_model();

      Promise.all([
        modelPromise,
        webCamPromise,
        // new Promise(resolve => resolve(true))
      ])
        .then((values) => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }

    const timeoutId = setTimeout(() => {
      document.querySelector("a-entity").setAttribute("animation-mixer", {
        timeScale: 1,
      });
      clearTimeout(timeoutId);
    }, 1000);
  }

  detectFrame = (video, model) => {
    tf.engine().startScope();
    // console.log('oing ingg', this.process_input(video));
    model.executeAsync(this.process_input(video)).then((predictions) => {
      // console.log("amng predictions", predictions);

      // for (let i = 0; i < predictions.length; i++) {
      //   console.log('mehehe',i,predictions[i].dataSync());
      //   console.log('mehehe',i,predictions[i].arraySync());
      // }
      this.renderPredictions(predictions, video);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
      tf.engine().endScope();
    });
  };

  process_input(video_frame) {
    const tfimg = tf.browser.fromPixels(video_frame).toInt();
    const expandedimg = tfimg.transpose([0, 1, 2]).expandDims();
    return expandedimg;
  }

  buildDetectedObjects(scores, threshold, boxes, classes, classesDir) {
    const detectionObjects = [];
    var video_frame = document.getElementById("frame");
    // console.log("hohoy1", scores, threshold);
    scores[0].forEach((_score, i) => {
      // scores.forEach((_score, i) => {
      // const score = _score;
      // const score = _score[1];
      // const score = _score[0];
      // muwork sa akoa
      const score = _score[1];
      // const score = (_score[0]+_score[1])/2;
      // console.log("hohoy", scores, score, _score, threshold, boxes);
      if (score > threshold) {
        // console.log("hohoy pasok", score, _score);
        const bbox = [];
        // // muwork sa akng mitch
        // const minY = boxes[0][i][0] * video_frame.offsetHeight;
        // const minX = boxes[0][i][1] * video_frame.offsetWidth;
        // const maxY = boxes[0][i][2] * video_frame.offsetHeight;
        // const maxX = boxes[0][i][3] * video_frame.offsetWidth;
        // // const minY = 0;
        // // const minX = 0;
        // // const maxY = 0;
        // // const maxX = 0;
        // bbox[0] = minX;
        // bbox[1] = minY;
        // bbox[2] = maxX - minX;
        // bbox[3] = maxY - minY;

        // // muwork para sa akoa 2krubicks
        // const minY = boxes[i * 4] * video_frame.offsetHeight;
        // const minX = boxes[i * 4 + 1] * video_frame.offsetWidth;
        // const maxY = boxes[i * 4 + 2] * video_frame.offsetHeight;
        // const maxX = boxes[i * 4 + 3] * video_frame.offsetWidth;
        // bbox[0] = minX;
        // bbox[1] = minY;
        // bbox[2] = maxX - minX;
        // bbox[3] = maxY - minY;
        // muwork para sa akoa 6krubicks
        const minY = boxes[0][i][0] * video_frame.offsetHeight;
        const minX = boxes[0][i][1] * video_frame.offsetWidth;
        const maxY = boxes[0][i][2] * video_frame.offsetHeight;
        const maxX = boxes[0][i][3] * video_frame.offsetWidth;
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        detectionObjects.push({
          class: classes[i],
          label: `rubicks - ${score} = ${_score[0]} + ${_score[1]}`,
          score: score.toFixed(4),
          bbox: bbox,
        });
      }
    });
    return detectionObjects;
  }

  renderPredictions = (predictions) => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    //Getting predictions
    // // muwork sa kang mitch
    // const boxes = predictions[4].arraySync();
    // const scores = predictions[5].arraySync();
    // const classes = predictions[6].dataSync();
    // muwork sa akoang 2k
    // const boxes = predictions[0].dataSync();
    // const scores = predictions[1].arraySync();
    // const classes = predictions[2].dataSync();
    // const boxes = predictions[1].dataSync();
    // const scores = predictions[0].dataSync();
    // const classes = predictions[2].dataSync();

    const boxes = predictions[2].arraySync();
    const scores = predictions[4].arraySync();
    const classes = predictions[6].dataSync();
    const detections = this.buildDetectedObjects(
      scores,
      threshold,
      boxes,
      classes,
      classesDir
    );

    /**
     * the original implementation
    detections.forEach((item) => {
      const x = item["bbox"][0];
      const y = item["bbox"][1];
      const width = item["bbox"][2];
      const height = item["bbox"][3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(
        item["label"] + " " + (100 * item["score"]).toFixed(2) + "%"
      ).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });
     */

    // /**
    //  * this should work

    detections.forEach((item) => {
      const x = item["bbox"][0];
      // const x = item["bbox"][0] / 2;
      const y = item["bbox"][1];
      const width = item["bbox"][2];
      const height = item["bbox"][3];
      const label = item["label"];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(
        item["label"] + " " + (100 * item["score"]).toFixed(2) + "%"
      ).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x, y);

      // -5 from the left most, 5 to the right most, 0 is center
      // xPos: 0,
      // 5 is the top most, 0 is most bottom of screen
      // yPos: 0,
      // const newX = 0;
      // const newY = 2;
      // const newX = ((x + width / 2) / window.innerWidth) * 10 - 5;
      // const newY = 5 - ((y + height / 2) / window.innerHeight) * 5;
      // formula if for mitch
      const newX = (x / window.innerWidth) * 10 - 5;
      // const newY = 5 - ((y) / window.innerHeight) * 5;
      const newY = 2;
      // console.log("mao ni sha", detections);

      document.querySelector("a-entity").setAttribute("position", {
        x: newX,
        y: newY,
        z: -5,
      });
      document.querySelector("a-entity").setAttribute("visible", true);
    });
    //  */
  };

  takePhoto = () => {
    const ctx = this.canvasRef.current.getContext("2d");
    const video = this.videoRef.current;
    const video_frame = document.getElementById("frame");
    const height = video_frame.offsetHeight;
    const width = video_frame.offsetWidth;
    // if (width && height) {
    // ctx.width = width;
    // ctx.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const link = document.createElement("a");
    link.download = "filename.png";
    link.href = document.getElementById("canvas-id").toDataURL();
    link.click();

    // const data = ctx.toDataURL("image/png");
    // photo.setAttribute("src", data);
    // console.log("ayaya", data);
    // } else {
    //   clearphoto();
    // }
  };

  render() {
    return (
      <div>
        <video
          // style={{ height: "600px", width: "500px" }}
          // style={{ height: "1200px", width: "1000px" }}
          // style={{ height: "100vh", width: "100vw" }}
          style={{
            height: window.innerHeight,
            width: window.innerWidth,
            backgroundColor: "black",
          }}
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          // width="600"
          // height="500"
          // width="1200"
          // height="1000"
          // width="100vw"
          // height="100vh"
          height={window.innerHeight}
          width={window.innerWidth}
          id="frame"
        />
        <canvas
          className="size"
          id="canvas-id"
          ref={this.canvasRef}
          // width="600"
          // height="500"
          // width="1200"
          // height="1000"
          // width="100vw"
          // height="100vh"
          height={window.innerHeight}
          width={window.innerWidth}
        />

        <a-scene>
          <a-entity
            visible
            // visible={false}
            // position="-1 0.5 -3"
            // position="0 1 -3"
            // position="4 4 -3"
            position="0 0 -5"
            // position="0 0 -3"
            // position={`0 0 ${extension}`}
            // scale="0.25 0.25 0.25"
            // scale="0.1 0.1 0.1"
            // scale="1 1 1"
            scale="5 5 5"
            // gltf-model="https://raw.githubusercontent.com/itsmitchyyy/itsmitchyyy.github.io/main/ar-playground/mamoth/mamoth-1.glb"
            // gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AnimatedCube/glTF/AnimatedCube.gltf"
            // gltf-model="http://localhost:3000/animated-cube/AnimatedCube.gltf"
            // gltf-model="http://localhost:3000/morph-sphere/AnimatedMorphSphere.gltf"
            // gltf-model="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf"
            // gltf-model="https://7211-120-28-230-7.ap.ngrok.io/yellow_plaster_4k.gltf"
            // gltf-model="http://localhost:3000/mammoth/mammoth-moving.gltf"
            // gltf-model="http://localhost:3000/mammoth/whale.gltf"
            // gltf-model="http://localhost:3000/mammoth/mammooth-fossil.gltf"
            gltf-model="http://localhost:3000/whale/whale-2nd-animation.glb"
          ></a-entity>
        </a-scene>
        <ReusableModal
          show={this.state.isModalOpen}
          handleClose={(ev) => {
            this.setState({ isModalOpen: false });
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "100vw",
            height: "100vw",
            // background: "#33669932",
          }}
          onClick={() => {
            if (!this.state.isModalOpen) {
              this.setState({ isModalOpen: true });
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100vw",
              background: "transparent",
              color: "white",
              height: "80vh",
              left: 0,
              top: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[0, 1, 2].map((row, rowIndex) => (
              <div key={`row-${row}]`} style={{ flex: 1, display: "flex" }}>
                {[0, 1, 2].map((col, colIndex) => (
                  <div
                    key={`col-${col}`}
                    style={{
                      flex: 1,
                      borderRight: "solid #FFFFFF66 0.7px",
                      borderBottom:
                        rowIndex === 2 ? "none" : "solid #FFFFFF66 0.7px",
                    }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100vw",
              background: "black",
              color: "white",
              height: "20vh",
              left: 0,
              top: "80vh",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ marginLeft: 50 }}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.2081 0H2.79193C2.05146 0 1.34133 0.294149 0.817737 0.817737C0.294149 1.34133 0 2.05146 0 2.79193L0 19.2081C0 19.5747 0.0722154 19.9378 0.212523 20.2765C0.35283 20.6152 0.558482 20.923 0.817737 21.1823C1.07699 21.4415 1.38477 21.6472 1.7235 21.7875C2.06224 21.9278 2.42529 22 2.79193 22H19.2081C19.9485 22 20.6587 21.7059 21.1823 21.1823C21.7059 20.6587 22 19.9485 22 19.2081V2.79193C22 2.05146 21.7059 1.34133 21.1823 0.817737C20.6587 0.294149 19.9485 0 19.2081 0V0ZM2.79193 2.26906H19.2081C19.3467 2.26906 19.4797 2.32415 19.5778 2.4222C19.6759 2.52026 19.7309 2.65325 19.7309 2.79193V13.9004L17.452 11.3552C17.3534 11.2368 17.2547 11.1085 17.1363 10.9803L16.9982 10.852C16.4951 10.3883 16.0709 10.3982 15.4789 10.852C15.1435 11.1381 14.8081 11.4341 14.4924 11.7103C14.3948 11.804 14.279 11.8767 14.1521 11.9237C14.0253 11.9708 13.8901 11.9912 13.755 11.9838C13.62 11.9764 13.4878 11.9413 13.3669 11.8807C13.246 11.8201 13.1388 11.7352 13.052 11.6314C11.9274 10.5067 10.852 9.33274 9.77668 8.17848C9.663 8.04197 9.52199 7.93077 9.36274 7.85205C9.20348 7.77333 9.02951 7.72881 8.85202 7.72138C8.67453 7.71394 8.49745 7.74375 8.33217 7.80889C8.16689 7.87402 8.01708 7.97303 7.89238 8.09955L7.77399 8.2278L7.62601 8.40538L7.41883 8.65202L2.26906 14.6502V2.81166C2.2664 2.74135 2.27796 2.67123 2.30305 2.6055C2.32814 2.53977 2.36623 2.47977 2.41505 2.42911C2.46387 2.37845 2.52241 2.33816 2.58717 2.31066C2.65193 2.28316 2.72157 2.26901 2.79193 2.26906Z"
                  fill="white"
                />
              </svg>
            </div>
            <div
              onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                this.takePhoto();
              }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M28 54C42.3596 54 54 42.3596 54 28C54 13.6404 42.3596 2 28 2C13.6404 2 2 13.6404 2 28C2 42.3596 13.6404 54 28 54Z"
                  stroke="white"
                  strokeWidth="4"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M28 48.4286C39.2827 48.4286 48.4286 39.2827 48.4286 28C48.4286 16.7173 39.2827 7.57141 28 7.57141C16.7173 7.57141 7.57144 16.7173 7.57144 28C7.57144 39.2827 16.7173 48.4286 28 48.4286Z"
                  fill="#FF3B30"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M28 48.4286C39.2827 48.4286 48.4286 39.2827 48.4286 28C48.4286 16.7173 39.2827 7.57141 28 7.57141C16.7173 7.57141 7.57144 16.7173 7.57144 28C7.57144 39.2827 16.7173 48.4286 28 48.4286Z"
                  fill="white"
                />
              </svg>
            </div>
            <div style={{ marginRight: 50 }}>
              <svg
                width="41"
                height="41"
                viewBox="0 0 41 41"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40.96 20.48C40.96 9.16921 31.7908 0 20.48 0C9.16921 0 0 9.16921 0 20.48C0 31.7908 9.16921 40.96 20.48 40.96C31.7908 40.96 40.96 31.7908 40.96 20.48Z"
                  fill="white"
                />
                <path
                  d="M20.48 35.8399C28.9631 35.8399 35.84 28.963 35.84 20.4799C35.84 11.9968 28.9631 5.11987 20.48 5.11987C11.9969 5.11987 5.12 11.9968 5.12 20.4799C5.12 28.963 11.9969 35.8399 20.48 35.8399Z"
                  fill="#FF453A"
                  stroke="black"
                  strokeWidth="3.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
