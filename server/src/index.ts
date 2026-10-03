import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
// All interfaces, explicitly: Render's proxy and phones on the LAN both connect from
// outside the machine, so a loopback-only bind would be unreachable to both.
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
});
