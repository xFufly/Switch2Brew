import dgram from 'dgram';
import os from 'os';

const DNS_PORT = 53;
// IP de redirection: utilise CAPTIVE_IP si défini, sinon IP LAN locale
function getLocalLANIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

const SERVER_IP = process.env.CAPTIVE_IP || getLocalLANIp();

// Domaines spécifiques à capturer pour le portail captif
const CAPTIVE_DOMAINS = [
    'ctest.cdn.nintendo.net',
    'conntest.nintendowifi.net',
    'detectportal.firefox.com',
    'connectivitycheck.gstatic.com',
    'connectivitycheck.android.com',
    'clients1.google.com',
    'clients3.google.com',
    'captive.apple.com',
    'ctest.p01.ctest.srv.nintendo.net',
    'www.msftconnecttest.com',
    'api.afk-simulator.com'
];

const server = dgram.createSocket('udp4');

function parseDNSQuery(msg) {
    try {
        let pos = 12;
        const labels = [];

        while (pos < msg.length && msg[pos] !== 0) {
            const len = msg[pos];
            if (len === 0 || len > 63) break;
            pos++;
            if (pos + len > msg.length) break;
            labels.push(msg.toString('utf8', pos, pos + len));
            pos += len;
        }

        return labels.join('.');
    } catch (err) {
        return '';
    }
}

function createDNSResponse(query, domain) {
    const response = Buffer.alloc(512);

    // Copier l'en-tête et la question
    query.copy(response, 0, 0, Math.min(query.length, 512));

    // Flags: réponse standard, pas d'erreur
    response[2] = 0x81;
    response[3] = 0x80;

    // Answer count = 1
    response[6] = 0x00;
    response[7] = 0x01;

    let pos = query.length;

    // Pointer vers le nom dans la question (compression DNS)
    response[pos++] = 0xC0;
    response[pos++] = 0x0C;

    // Type A (IPv4)
    response[pos++] = 0x00;
    response[pos++] = 0x01;

    // Class IN
    response[pos++] = 0x00;
    response[pos++] = 0x01;

    // TTL (30 secondes)
    response[pos++] = 0x00;
    response[pos++] = 0x00;
    response[pos++] = 0x00;
    response[pos++] = 0x1E;

    // Data length (4 octets pour IPv4)
    response[pos++] = 0x00;
    response[pos++] = 0x04;

    // IP Address
    const ip = SERVER_IP.split('.');
    response[pos++] = parseInt(ip[0]);
    response[pos++] = parseInt(ip[1]);
    response[pos++] = parseInt(ip[2]);
    response[pos++] = parseInt(ip[3]);

    return response.slice(0, pos);
}

server.on('message', (msg, rinfo) => {
    try {
        const domain = parseDNSQuery(msg);

        if (domain) {
            // Vérifier si c'est un domaine de captive portal
            const isCaptiveDomain = CAPTIVE_DOMAINS.some(d => domain.includes(d));

            if (isCaptiveDomain) {
                // console.log(`🎮 CAPTIVE DNS: ${domain} -> ${SERVER_IP}`);
            } else {
                // console.log(`DNS Query: ${domain} -> ${SERVER_IP}`);
            }

            const response = createDNSResponse(msg, domain);
            server.send(response, 0, response.length, rinfo.port, rinfo.address);
        }
    } catch (err) {
        console.error('DNS Error:', err.message);
    }
});

server.on('error', (err) => {
    console.error('DNS Server error:', err);
});

server.on('listening', () => {
    const address = server.address();
    console.log(`✓ DNS Server running on ${address.address}:${address.port}`);
    console.log(`✓ Redirecting ALL domains to ${SERVER_IP}`);
    console.log(`✓ Captive portal domains configured`);
});

server.bind(DNS_PORT, '0.0.0.0');