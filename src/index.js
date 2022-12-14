import React from "react";
import ReactDOM from "react-dom";
import * as tf from "@tensorflow/tfjs";
// import { loadGraphModel, load } from "@tensorflow/tfjs-converter";
import "./styles.css";
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

// const videoConstraints = {
//   width: "100vw",
//   height: "100vh",
// };

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

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
      const score = (_score[1]);
      // const score = (_score[0]+_score[1])/2;
      console.log("hohoy", scores, score, _score, threshold, boxes);
      if (score > threshold) {
        console.log("hohoy pasok", score, _score);
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

  render() {
    return (
      <div>
        <h1>Real-Time Object Detection: Kangaroo</h1>
        <h3>MobileNetV2</h3>
        <video
          // style={{ height: "600px", width: "500px" }}
          // style={{ height: "1200px", width: "1000px" }}
          // style={{ height: "100vh", width: "100vw" }}
          style={{ height: window.innerHeight, width: window.innerWidth }}
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
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
