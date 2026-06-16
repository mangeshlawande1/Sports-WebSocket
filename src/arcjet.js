// centallize for security logic
//  define setup rule separately    
import arcjet, { detectBot, shield, slidingWindow } from '`@arcjet/node`';


const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode =
    process.env.ARCJET_MODE === 'LIVE' ?
    'LIVE' :
    'DRY_RUN';

if (!arcjetKey) {
    throw new Error("ARCJET_KEY is missing in environment variables");
};


export const httpArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode, }),
        detectBot({
            mode: arcjetMode,
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW"
            ]
        }),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
    ]
});


export const wsArcjet = arcjetKey ? arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode, }),
        detectBot({
            mode: arcjetMode,
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW"
            ]
        }),
        slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
    ]
}) : null;

export function securityMiddleware() {
    return async(req, res, next) => {
        if (!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req);

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: "Too Many Requests " })
                }
                return res.status(403).json({ error: "Forbidden" })
            }
        } catch (error) {
            console.error("Arcjet middleware error", error)
            return res.status(503).json({ error: 'Service Unavailable' })
        }
        next();
    }
}