'use strict'

const fs = require('fs')
const cheerio = require('cheerio')
const isSVG = require('is-svg')
const uniq = require('lodash/uniq')
const filter = require('lodash/filter')
const compact = require('lodash/compact')
const chroma = require('chroma-js')
const hexy = /^#[0-9a-f]{3,6}$/i

function isColorString (str) {
  if (!str) return false
  str = str.toUpperCase()
  const success = filter([
    /^(#)((?:[A-Fa-f0-9]{3}){1,2})$/i,
    /^(rgb|hsl)(a?)[(]\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*(?:,\s*([\d.]+)\s*)?[)]$/i
  ], (pattern) => {
    let match = str.match(pattern)
    return (match && match.length)
  })
  return (success && success.length)
}

function color (str) {
  return isColorString(str) ? chroma(str) : null
}

module.exports = function getSvgColors (input, options) {

  if (!isSVG(input)) {
    input = fs.readFileSync(input, 'utf8')
  }

  const $ = cheerio.load(input)

  // Find elements with a `fill` attribute
  var fills = $('[fill]').map(function (i, el) {
    return color($(this).attr('fill'))
  }).get()

  // Find elements with a `stroke` attribute
  var strokes = $('[stroke]').map(function (i, el) {
    return color($(this).attr('stroke'))
  }).get()

  // Find `fill` and `stroke` within inline styles
  $('[style]').each(function (i, el) {
    fills.push(color($(this).css('fill')))
    strokes.push(color($(this).css('stroke')))
  })

  // Find elements with a `stop-color` attribute (gradients)
  var stops = $('[stop-color]').map(function (i, el) {
    return color($(this).attr('stop-color'))
  }).get()

  if (options && options.flat) {
    return compact(uniq(fills.concat(strokes).concat(stops)))
  }

  return {
    fills: compact(uniq(fills)),
    strokes: compact(uniq(strokes)),
    stops: compact(uniq(stops))
  }

}
