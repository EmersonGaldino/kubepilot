/** Vite copies `public/app-icon.png` next to `index.html`. `BASE_URL` is `/`
 * in `npm run dev` and `./` in the packaged app, so this never resolves to
 * `file:///app-icon.png`. */
export const APP_ICON_URL = `${import.meta.env.BASE_URL}app-icon.png`
