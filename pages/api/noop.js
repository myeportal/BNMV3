export default async function handler(req, res) {
    res.status(200).end("noop");
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};
