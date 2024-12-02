"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const helmet_1 = __importDefault(require("helmet"));
const express_handlebars_1 = require("express-handlebars");
const rutasUser_1 = require("./rutasUser");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const port = 5000;
const expressApp = (0, express_1.default)();
const proxy = http_proxy_1.default.createProxyServer({
    target: "http://localhost:5100", ws: true
});
expressApp.use(express_1.default.urlencoded({ extended: true }));
//express busca  archivos de plantilla en esa carpeta
expressApp.set("views", "templates/server");
//establece a Handlebars como motor de plantillas
expressApp.engine("handlebars", (0, express_handlebars_1.engine)());
//se usa el motor de plantillas "handlebars"
expressApp.set("view engine", "handlebars");
expressApp.use((0, helmet_1.default)());
expressApp.use(express_1.default.json());
// Configura express-session
expressApp.use((0, express_session_1.default)({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 }
}));
expressApp.use(passport_1.default.initialize());
(0, rutasUser_1.registerFormRoutesUser)(expressApp);
expressApp.use(express_1.default.static("/static"));
expressApp.get('/static/styles.css', (req, res) => {
    res.type('application/css');
    res.sendFile(path_1.default.join(__dirname, '/static/styles.css'));
});
//static file
expressApp.use(express_1.default.static('src/client'));
expressApp.get('/src/client/reserve.js', (req, res) => {
    res.type('application/javascript');
    res.sendFile(path_1.default.join(__dirname, 'src/client/reserve.js'));
});
//scripts externos
expressApp.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "script-src 'self' https://cdn.jsdelivr.net;");
    next();
});
expressApp.use(express_1.default.static("node_modules/bootstrap/dist"));
//use agrega middleware redirige req a la url de target, no Sockets
expressApp.use("^/$", (req, resp) => resp.redirect("/loggin"));
expressApp.use((req, resp) => proxy.web(req, resp));
const server = (0, http_1.createServer)(expressApp);
//se activa una req de upgrade, redirecciona a webSockets
server.on('upgrade', (req, socket, head) => proxy.ws(req, socket, head));
server.listen(port, () => console.log(`HTTP Server listening on http://localhost:${port}`));
