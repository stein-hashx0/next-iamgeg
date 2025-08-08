import type { NextApiRequest, NextApiResponse } from 'next'
import React from 'react'
import satori from 'satori'
import path from 'node:path'
import fs from 'node:fs'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const query = req.query

    // Extract query parameters
    const thinParam = Array.isArray(query.thin) ? query.thin[0] : query.thin
    const blackParam = Array.isArray(query.black) ? query.black[0] : query.black
    const colorParam = Array.isArray(query.color) ? query.color[0] : query.color
    const widthParam = Array.isArray(query.width) ? query.width[0] : query.width
    const heightParam = Array.isArray(query.height) ? query.height[0] : query.height
    const fontSizeParam = Array.isArray(query.fontSize) ? query.fontSize[0] : query.fontSize

    const thinText = typeof thinParam === 'string' ? thinParam : ''
    const blackText = typeof blackParam === 'string' ? blackParam : ''
    const color = typeof colorParam === 'string' ? colorParam : '#000000'
    const width = widthParam ? parseInt(String(widthParam), 10) : 1200
    const height = heightParam ? parseInt(String(heightParam), 10) : 630
    const fontSize = fontSizeParam ? parseInt(String(fontSizeParam), 10) : 64

    // Load font files
    const thinFontPath = path.join(process.cwd(), 'public', 'fonts', 'StabilGrotesk-Thin.ttf')
    const blackFontPath = path.join(process.cwd(), 'public', 'fonts', 'StabilGrotesk-Black.ttf')

    const thinFontBuffer = fs.readFileSync(thinFontPath)
    const blackFontBuffer = fs.readFileSync(blackFontPath)

    // Create the SVG with satori
    const svg = await satori(
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
          },
        },
        [
          React.createElement(
            'span',
            {
              style: {
                fontFamily: 'StabilGrotesk',
                fontWeight: 100,
                color,
                fontSize,
              },
            },
            thinText,
          ),
          React.createElement(
            'span',
            {
              style: {
                fontFamily: 'StabilGrotesk',
                fontWeight: 900,
                color,
                fontSize,
              },
            },
            blackText,
          ),
        ],
      ),
      {
        width,
        height,
        fonts: [
          {
            name: 'StabilGrotesk',
            data: thinFontBuffer,
            weight: 100,
            style: 'normal',
          },
          {
            name: 'StabilGrotesk',
            data: blackFontBuffer,
            weight: 900,
            style: 'normal',
          },
        ],
      },
    )

    const { Resvg } = await import('@resvg/resvg-js')
    const resvg = new Resvg(svg, { background: 'rgba(0,0,0,0)' })
    const pngBuffer = resvg.render().asPng()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(200).send(pngBuffer)
  } catch (error: any) {
    console.error('Error generating image:', error)
    res.status(500).json({ error: 'Failed to generate image' })
  }
}

