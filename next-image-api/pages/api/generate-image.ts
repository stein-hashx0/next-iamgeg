import type { NextApiRequest, NextApiResponse } from 'next'
import React from 'react'
import satori from 'satori'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Next.js API route that generates a PNG image on‑the‑fly using satori and resvg.
 *
 * It accepts several query parameters to customise the output:
 *  - `text` (string): the text to render in the image. Defaults to "Hello".
 *  - `width` (number): width of the resulting image in pixels. Defaults to 1200.
 *  - `height` (number): height of the resulting image in pixels. Defaults to 630.
 *  - `color` (string): CSS colour for the text. Defaults to '#000000' (black).
 *  - `fontSize` (number): font size for the text in pixels. Defaults to 64.
 *
 * The route loads two custom fonts from the public/fonts directory:
 *  - StabilGrotesk-Regular.otf (weight 400)
 *  - StabilGrotesk-Bold.otf (weight 700)
 *
 * It uses satori to convert a small React layout into an SVG, then resvg-js
 * converts that SVG into a PNG buffer. The buffer is returned directly to
 * clients with appropriate content‑type headers.
 */

export const config = {
  // Use the Node.js runtime instead of the edge runtime so we can access the
  // filesystem synchronously.
  runtime: 'nodejs',
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    // Extract and sanitise query parameters with sensible defaults.
    const query = req.query
    const textParam = Array.isArray(query.text) ? query.text[0] : query.text
    const widthParam = Array.isArray(query.width) ? query.width[0] : query.width
    const heightParam = Array.isArray(query.height) ? query.height[0] : query.height
    const colorParam = Array.isArray(query.color) ? query.color[0] : query.color
    const fontSizeParam = Array.isArray(query.fontSize)
      ? query.fontSize[0]
      : query.fontSize

    const text = typeof textParam === 'string' && textParam.length > 0 ? textParam : 'Hello'
    const width = widthParam ? parseInt(String(widthParam), 10) : 1200
    const height = heightParam ? parseInt(String(heightParam), 10) : 630
    const color = typeof colorParam === 'string' && colorParam.length > 0 ? colorParam : '#000000'
    const fontSize = fontSizeParam ? parseInt(String(fontSizeParam), 10) : 64

    // Resolve font paths relative to the project root. process.cwd() points to
    // the Next.js project directory when running with `next dev` or in
    // production.
    const regularFontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'StabilGrotesk-Regular.ttf',
    )
    const boldFontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'StabilGrotesk-Bold.ttf',
    )

    // Read font files from the filesystem synchronously. Since this API runs
    // using the Node.js runtime, synchronous IO is acceptable and ensures
    // correct bundling by Next.js. The fonts are read as Buffer objects.
    const regularFontBuffer = fs.readFileSync(regularFontPath)
    const boldFontBuffer = fs.readFileSync(boldFontPath)

    // Create an SVG from JSX using satori. The returned value is a string
    // containing an SVG document. We supply our custom fonts to satori with
    // names matching the CSS `fontFamily` values defined in the JSX below.
    // Build a minimal React element tree using `React.createElement` rather than
    // JSX. API routes are not compiled as `tsx` by default, so JSX syntax
    // cannot be used here. Instead, we explicitly create the DOM tree.
    const svg = await satori(
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          },
        },
        React.createElement(
          'span',
          {
            style: {
              fontFamily: 'StabilGrotesk',
              fontWeight: 700,
              color,
              fontSize,
              whiteSpace: 'pre-wrap',
            },
          },
          text,
        ),
      ),
      {
        width,
        height,
        fonts: [
          {
            name: 'StabilGrotesk',
            data: regularFontBuffer,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'StabilGrotesk',
            data: boldFontBuffer,
            weight: 700,
            style: 'normal',
          },
        ],
      },
    )

    // Dynamically import the Resvg class from resvg-js. This library only
    // exposes ESM modules, so using dynamic import avoids issues when
    // transpiling for a CommonJS environment. The import call returns a
    // namespace object containing the Resvg constructor.
    const { Resvg } = await import('@resvg/resvg-js')

    // Instantiate the renderer with the generated SVG. We set the
    // background to transparent so that the resulting PNG retains alpha
    // transparency. When no `fitTo` option is provided, resvg will use the
    // original SVG dimensions.
    const resvg = new Resvg(svg, {
      background: 'rgba(0,0,0,0)',
    })

    // Render the PNG. The returned object exposes an `asPng()` method that
    // returns a Node.js Buffer containing PNG binary data.
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    // Set response headers and send the PNG buffer as the body. The
    // `Content-Type` header ensures browsers treat the response as an image.
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(200).send(pngBuffer)
  } catch (error: any) {
    console.error('Error generating image:', error)
    res.status(500).json({ error: 'Failed to generate image' })
  }
}
