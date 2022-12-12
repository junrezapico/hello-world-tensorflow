import React from "react";
import ReactDOM from "react-dom";
import * as tf from "@tensorflow/tfjs";
import "./styles.css";
tf.setBackend("webgl");

const threshold = 0.75;
async function load_model() {
  // It's possible to load the model locally or from a repo
  // You can choose whatever IP and PORT you want in the "http://127.0.0.1:8080/model.json" just set it before in your https server
  // const model = await tf.loadGraphModel("http://127.0.0.1:8080/model.json");
  // const model = await tf.loadGraphModel(
  //   "https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json"
  // );
  const model = await tf.loadGraphModel(
    "https://raw.githubusercontent.com/itsmitchyyy/itsmitchyyy.github.io/main/ar-playground/another_model/model.json"
  );
  return model;
}

let classesDir = {
  1: {
    name: "rubicks",
    id: 1,
  },
  2: {
    name: "Other",
    id: 2,
  },
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  videoRef = React.createRef();
  canvasRef = React.createRef();
  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
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
        });
      const modelPromise = load_model();
      Promise.all([modelPromise, webCamPromise])
        .then((values) => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
  detectFrame = (video, model) => {
    tf.engine().startScope();
    model.executeAsync(this.process_input(video)).then((predictions) => {
      console.log("amng predictions", predictions);
      
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

    scores[0].forEach((score, i) => {
      if (score > threshold) {
        const bbox = [];
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
          label: "rubicks",
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

    //Getting predictionsZ
    const boxes = predictions[4].arraySync();
    const scores = predictions[5].arraySync();
    const classes = predictions[6].dataSync();
    const detections = this.buildDetectedObjects(
      scores,
      threshold,
      boxes,
      classes,
      classesDir
    );
    if (detections.length > 0) {
      this.setState({ visible: true });
    } else {
      this.setState({ visible: false });
    }

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

    detections.forEach((item) => {
      const x = item["bbox"][0];
      const y = item["bbox"][1];

      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(
        item["label"] + " " + (100 * item["score"]).toFixed(2) + "%",
        x,
        y
      );
    });
  };

  render() {
    return (
      <div className="App-header">
        <div style={{ position: "absolute", top: "30px" }}>
          <h1>Real-Time Object Detection</h1>
          <h3>MobileNetV2</h3>

          <video
            autoPlay
            playsInline
            muted
            ref={this.videoRef}
            width="600"
            height="500"
            id="frame"
            style={{ position: "absolute", top: "200px" }}
          />

          <div style={{ position: "absolute", zIndex: "9999", top: "200px" }}>
            <canvas ref={this.canvasRef} width="600" height="500" />

            <a-scene embedded vr-mode-ui="enabled: false;">
              <a-entity
                visible={this.state.visible}
                gltf-model="https://raw.githubusercontent.com/itsmitchyyy/itsmitchyyy.github.io/main/ar-playground/mamoth/mamoth-1.glb"
                position="-1 0.5 -3"
                scale="1 1 1"
              ></a-entity>
            </a-scene>
          </div>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);