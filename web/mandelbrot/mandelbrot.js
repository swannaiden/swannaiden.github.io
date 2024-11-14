const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const maxIter = 25;

let centerX = width / 2;
let centerY = height / 2;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

function mandelbrot(c, maxIter) {
    let z = math.complex(0, 0);
    let n = 0;

    while (math.abs(z) <= 2 && n < maxIter) {
        z = math.add(math.multiply(z, z), c);
        n++;
    }

    return n;
}

function drawMandelbrotHighRes(resolutionFactor) {
    const highResWidth = width * resolutionFactor;
    const highResHeight = height * resolutionFactor;
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = highResWidth;
    highResCanvas.height = highResHeight;
    const highResCtx = highResCanvas.getContext('2d');

    for (let x = 0; x < highResWidth; x++) {
        for (let y = 0; y < highResHeight; y++) {
            const re = (x / resolutionFactor - centerX - offsetX) / (width / 4) * zoom;
            const im = (y / resolutionFactor - centerY - offsetY) / (height / 4) * zoom;
            const c = math.complex(re, im);

            const m = mandelbrot(c, maxIter*2);

            const color = `rgb(${m % 8 * 32}, ${m % 16 * 16}, ${m % 32 * 8})`;
            highResCtx.fillStyle = color;
            highResCtx.fillRect(x, y, 1, 1);
        }
    }

    return highResCanvas;
}




const saveButton = document.getElementById('saveButton');
saveButton.addEventListener('click', () => {
    // Save the current scaled canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    // Draw and save the high-resolution image
    const resolutionFactor = 2; // Adjust this value to change the clarity of the saved image
    const highResCanvas = drawMandelbrotHighRes(resolutionFactor);
    const dataURL = highResCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'mandelbrot.png';
    link.click();

    // Restore the scaled canvas
    ctx.drawImage(tempCanvas, 0, 0);
});


const scalingFactor = 0.5;
const scaledWidth = width * scalingFactor;
const scaledHeight = height * scalingFactor;
const scaledCanvas = document.createElement('canvas');
scaledCanvas.width = scaledWidth;
scaledCanvas.height = scaledHeight;
const scaledCtx = scaledCanvas.getContext('2d');

// drawMandelbrot() with the default color scheme
function drawMandelbrot() {
    for (let x = 0; x < scaledWidth; x++) {
        for (let y = 0; y < scaledHeight; y++) {
            const re = ((x / scalingFactor) - centerX - offsetX) / (width / 4) * zoom;
            const im = ((y / scalingFactor) - centerY - offsetY) / (height / 4) * zoom;
            const c = math.complex(re, im);

            const m = mandelbrot(c, maxIter);

            const color = `rgb(${m % 8 * 32}, ${m % 16 * 16}, ${m % 32 * 8})`;
            scaledCtx.fillStyle = color;
            scaledCtx.fillRect(x, y, 1, 1);
        }
    }
    ctx.drawImage(scaledCanvas, 0, 0, width, height);
}


// function drawMandelbrot() {
//     for (let x = 0; x < scaledWidth; x++) {
//         for (let y = 0; y < scaledHeight; y++) {
//             const re = ((x / scalingFactor) - centerX - offsetX) / (width / 4) * zoom;
//             const im = ((y / scalingFactor) - centerY - offsetY) / (height / 4) * zoom;
//             const c = math.complex(re, im);

//             const m = mandelbrot(c, maxIter);

//             const color = m === -1 ? 'rgb(0, 0, 0)' : `rgb(${m % colorScheme[0]}, ${m % colorScheme[1]}, ${m % colorScheme[2]})`;
//             scaledCtx.fillStyle = color;
//             scaledCtx.fillRect(x, y, 1, 1);
//         }
//     }
//     ctx.drawImage(scaledCanvas, 0, 0, width, height);
// }


// drawMandelbrot() with the 2nd color scheme
// function drawMandelbrot() {
//     for (let x = 0; x < scaledWidth; x++) {
//         for (let y = 0; y < scaledHeight; y++) {
//             const re = ((x / scalingFactor) - centerX - offsetX) / (width / 4) * zoom;
//             const im = ((y / scalingFactor) - centerY - offsetY) / (height / 4) * zoom;
//             const c = math.complex(re, im);

//             const m = mandelbrot(c, maxIter);

//             const color = m === -1 ? 'rgb(0, 0, 0)' : `rgb(${(m * colorFactors[0]) % 256}, ${(m * colorFactors[1]) % 256}, ${(m * colorFactors[2]) % 256})`;
//             scaledCtx.fillStyle = color;
//             scaledCtx.fillRect(x, y, 1, 1);
//         }
//     }
//     ctx.drawImage(scaledCanvas, 0, 0, width, height);
// }


canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
    dragging = false;
});

let debounceTimeout;

// function drawMandelbrotDebounced() {
//     clearTimeout(debounceTimeout);
//     debounceTimeout = setTimeout(drawMandelbrot, 100);
// }

canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
        offsetX += e.clientX - lastX;
        offsetY += e.clientY - lastY;

        lastX = e.clientX;
        lastY = e.clientY;

        drawMandelbrotDebounced();
    }
});

const zoomInButton = document.getElementById('zoomInButton');
zoomInButton.addEventListener('click', () => {
    centerX = (centerX + offsetX);
    centerY = (centerY + offsetY);
    offsetX = 0;
    offsetY = 0;
    zoom *= 0.9;
    drawMandelbrot();
});

const zoomOutButton = document.getElementById('zoomOutButton');
zoomOutButton.addEventListener('click', () => {
    centerX = (centerX + offsetX);
    centerY = (centerY + offsetY);
    offsetX = 0;
    offsetY = 0;
    zoom *= 1.1;
    drawMandelbrot();
});


let colorScheme = [32, 16, 8];

function randomColorScheme() {
    const baseColor = [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    ];
    const colorOffsets = [
        1 + Math.floor(Math.random() * 63),
        1 + Math.floor(Math.random() * 63),
        1 + Math.floor(Math.random() * 63)
    ];
    return baseColor.map((color, index) => (color + colorOffsets[index]) % 256);
}

// let colorFactors = [1, 1, 1];

// function randomColorFactors() {
//     return [
//         1 + Math.floor(Math.random() * 4),
//         1 + Math.floor(Math.random() * 4),
//         1 + Math.floor(Math.random() * 4)
//     ];
// }


// Other code remains the same

// const colorButton = document.getElementById('colorButton');
// colorButton.addEventListener('click', () => {
//     colorFactors = randomColorFactors();
//     drawMandelbrot();
// });

// canvas.addEventListener('wheel', (e) => {
//     e.preventDefault();

//     const delta = e.deltaY > 0 ? 1.1 : 0.9;
//     const mouseX = e.clientX - canvas.getBoundingClientRect().left;
//     const mouseY = e.clientY - canvas.getBoundingClientRect().top;

//     offsetX -= (mouseX - offsetX - centerX) * (delta - 1);
//     offsetY -= (mouseY - offsetY - centerY) * (delta - 1);
//     zoom *= delta;

//     drawMandelbrotDebounced();
// });

// Other code remains the same

function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            func.apply(context, args);
        }, wait);
    };
}

const drawMandelbrotDebounced = debounce(drawMandelbrot, 250);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    const oldZoom = zoom;
    zoom *= Math.pow(1.1, -e.deltaY / 40);

    // Calculate new centerX and centerY based on mouse position
    centerX = (centerX + offsetX) - (mouseX / width) * (1 / oldZoom - 1 / zoom) * (width / 4);
    centerY = (centerY + offsetY) - (mouseY / height) * (1 / oldZoom - 1 / zoom) * (height / 4);

    // Reset offsetX and offsetY
    offsetX = 0;
    offsetY = 0;

    drawMandelbrot();
});

// Other code remains the same


drawMandelbrot();
