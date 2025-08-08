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
    const textParam = Array.isArray(query.text) ? query.text[0] : query.text || 'Hello'
    const boldParam = Array.isArray(query.bold) ? query.bold[0] : query.bold || ''
    const width = query.width ? parseInt(String(query.width), 10) : 1200
    const height = query.height ? parseInt(String(query.height), 10) : 630
    const color = typeof query.color === 'string' && query.color.length > 0 ? query.color : '#000000'
    const fontSize = query.fontSize ? parseInt(String(query.fontSize), 10) : 64

    const fontDir = path.join(process.cwd(), 'public', 'fonts')

    const regularFontBuffer = fs.readFileSync(path.join(fontDir, 'StabilGrotesk-Regular.ttf'))
    const boldFontBuffer = fs.readFileSync(path.join(fontDir, 'StabilGrotesk-Bold.ttf'))

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
            backgroundColor: '#eee',
            fontSize,
            color,
          },
        },
        [
          React.createElement(
            'span',
            {
              key: 'regular',
              style: {
                fontFamily: 'StabilGrotesk',
                fontWeight: 400,
              },
            },
            textParam
          ),
          boldParam &&
            React.createElement(
              'span',
              {
                key: 'bold',
                style: {
                  fontFamily: 'StabilGrotesk',
                  fontWeight: 700,
                  marginLeft: 10,
                },
              },
              boldParam
            ),
        ]
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
      }
    )

    const { Resvg } = await import('@resvg/resvg-js')
    const resvg = new Resvg(svg, {
      background: 'rgba(0,0,0,0)',
    })

    const pngBuffer = resvg.render().asPng()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(200).send(pngBuffer)
  } catch (error: any) {
    console.error('Error generating image:', error)
    res.status(500).json({ error: 'Failed to generate image' })
  }
}
