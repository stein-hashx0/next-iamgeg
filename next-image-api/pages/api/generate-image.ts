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
  res: NextApiResponse
): Promise<void> {
  try {
    const { thin, black, text, color, fontSize, width, height } = req.query

    const contentThin = Array.isArray(thin) ? thin[0] : thin || ''
    const contentBlack = Array.isArray(black) ? black[0] : black || ''
    const contentRegular = Array.isArray(text) ? text[0] : text || ''

    const fontColor =
      typeof color === 'string' && color.length > 0 ? color : '#1e0033'
    const size = fontSize ? parseInt(String(fontSize), 10) : 64
    const imageWidth = width ? parseInt(String(width), 10) : 1200
    const imageHeight = height ? parseInt(String(height), 10) : 630

    // Paths
    const fontDir = path.join(process.cwd(), 'public', 'fonts')
    const regularFontPath = path.join(fontDir, 'StabilGrotesk-Regular.ttf')
    const thinFontPath = path.join(fontDir, 'StabilGrotesk-Thin.ttf')
    const blackFontPath = path.join(fontDir, 'StabilGrotesk-Black.ttf')

    // Buffers
    const regularFont = fs.readFileSync(regularFontPath)
    const thinFont = fs.readFileSync(thinFontPath)
    const blackFont = fs.readFileSync(blackFontPath)

    // Construct the layout
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
            backgroundColor: '#f3f3f3',
          },
        },
        React.createElement(
          'span',
          {
            style: {
              fontFamily: 'StabilGrotesk',
              fontWeight: 300,
              fontSize: size,
              color: fontColor,
              marginRight: 8,
            },
          },
          contentThin
        ),
        React.createElement(
          'span',
          {
            style: {
              fontFamily: 'StabilGrotesk',
              fontWeight: 900,
              fontSize: size,
              color: fontColor,
              marginRight: 8,
            },
          },
          contentBlack
        ),
        React.createElement(
          'span',
          {
            style: {
              fontFamily: 'StabilGrotesk',
              fontWeight: 400,
              fontSize: size,
              color: fontColor,
            },
          },
          contentRegular
        )
      ),
      {
        width: imageWidth,
        height: imageHeight,
        fonts: [
          {
            name: 'StabilGrotesk',
            data: regularFont,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'StabilGrotesk',
            data: thinFont,
            weight: 300,
            style: 'normal',
          },
          {
            name: 'StabilGrotesk',
            data: blackFont,
            weight: 900,
            style: 'normal',
          },
        ],
      }
    )

    const { Resvg } = await import('@resvg/resvg-js')
    const resvg = new Resvg(svg, {
      background: 'rgba(0,0,0,0)',
    })

    const png = resvg.render().asPng()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(200).send(png)
  } catch (err) {
    console.error('Error generating image:', err)
    res.status(500).json({ error: 'Failed to generate image' })
  }
}
