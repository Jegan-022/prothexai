// three-hero.js
// Renders a 3D Sci-Fi Element for the Hero Section

const container = document.getElementById('hero-canvas');

// Scene Setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Geometry: Abstract Prosthetic Design (TorusKnot for now, clean wireframe)
const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
const material = new THREE.MeshBasicMaterial({
    color: 0x0DA2E7, // Primary Blue
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Lights (Cosmetic)
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    mesh.rotation.x += 0.002;
    mesh.rotation.y += 0.005;

    renderer.render(scene, camera);
}

animate();

// Resizing
window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
