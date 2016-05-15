'use strict'

/* global d3 */

let avatarSize = 32
let springLength = 70

let networhkGenerator = require('./src/networhk-generator')
let status2color = require('./src/status2color')
let lengthenLine = require('./src/lengthen-line')

let numPeople = parseInt(window.location.hash.substr(1)) || 250
let numContributions = Math.ceil(numPeople / 4)
let data = networhkGenerator(numPeople, numContributions)

// Initiate the graph
let force = d3.layout.force()
  .charge(-500)
  .linkDistance(springLength)
  .nodes([])
  .links([])
  .on('tick', tick)
let nodes = force.nodes()
let links = force.links()
let svg = d3.select('body').append('svg')
let container = svg.append('g')
var domLinks = container.append('g').attr('class', 'links').selectAll('.link')
var domNodes = container.append('g').attr('class', 'nodes').selectAll('.node')

// Step through force layout simulation
function tick () {
  domLinks
    .attr('x1', (link) => { return lengthenLine(link.source.x, link.source.y, link.target.x, link.target.y, -(avatarSize / 2)).x1 })
    .attr('y1', (link) => { return lengthenLine(link.source.x, link.source.y, link.target.x, link.target.y, -(avatarSize / 2)).y1 })
    .attr('x2', (link) => { return lengthenLine(link.source.x, link.source.y, link.target.x, link.target.y, -(avatarSize / 2)).x2 })
    .attr('y2', (link) => { return lengthenLine(link.source.x, link.source.y, link.target.x, link.target.y, -(avatarSize / 2)).y2 })

  domNodes.attr('transform', (node) => { return 'translate(' + node.x + ',' + node.y + ')' })
}

function updateLayout () {
  domNodes = container.select('.nodes').selectAll('.node').data(nodes, (node) => { return node.id })
  let nodeEnter = domNodes.enter().append('svg:g')
    .attr('class', 'node')
    .on('mousedown', () => { d3.event.stopPropagation() }) // prevent zoom translation while dragging
    .call(force.drag)
  nodeEnter
    .append('svg:circle')
    .attr('r', (node) => { return node.size })
    .style('stroke-width', (node) => { return (node.open) ? 3 : 1 })
    .style('stroke', (node) => { return (node.open) ? status2color[node.priority] : '#000' })
    .style('fill', (node) => {
      if (node.open) {
        return 'transparent'
      } else if (node.type === 'contribution') {
        return status2color[node.priority]
      }
      // person
      return '#FFF'
    })
  nodeEnter.append('svg:image')
    .attr('xlink:href', (node) => { return node.image })
    .attr('x', (node) => { return -node.size })
    .attr('y', (node) => { return -node.size })
    .attr('height', (node) => { return node.size * 2 })
    .attr('width', (node) => { return node.size * 2 })
  domNodes.exit().remove()

  domLinks = container.select('.links').selectAll('.link').data(links, (link) => { return link.source.id + '_' + link.target.id })
  domLinks.enter()
    .append('line')
    .attr('class', 'link')
    .style('stroke', (link) => { return status2color[link.status] })
    .style('stroke-width', 2)
  domLinks.exit().remove()

  force.start()
}

// Graph Features
resize()
d3.select(window).on('resize', resize)
function resize () {
  let width = window.innerWidth
  let height = window.innerHeight
  svg.attr('width', width).attr('height', height)
  force.size([width, height]).resume()
}

svg.call(d3.behavior.zoom().scaleExtent([0.1, 2]).on('zoom', zoom))
function zoom () {
  let translation = 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')'
  container.attr('transform', translation)
}

// Initiate data source
let GraphPopulator = require('./src/graph-populator')
new GraphPopulator(data, {
  beginUpdate: () => {
  },
  endUpdate: () => {
    updateLayout()
  },
  addCommitment: (commitment) => {
    let sourceId = 'contribution-' + commitment.contribution
    let targetId = 'person-' + commitment.person
    let sourceNode = nodes.filter((node) => { return node.id === sourceId })[0]
    let targetNode = nodes.filter((node) => { return node.id === targetId })[0]

    links.push({
      id: 'contribution-' + commitment.contribution + '_person-' + commitment.person,
      source: targetNode,
      target: sourceNode,
      status: commitment.status
    })
  },
  addPerson: (person) => {
    nodes.push({
      id: 'person-' + person.id,
      type: 'person',
      size: avatarSize / 2,
      x: Math.ceil(Math.random() * 100),
      y: Math.ceil(Math.random() * 100),
      image: './avatar.png'
    })
  },
  addContribution: (contribution) => {
    nodes.push({
      id: 'contribution-' + contribution.id,
      type: 'contribution',
      size: avatarSize / 4,
      x: Math.ceil(Math.random() * 100),
      y: Math.ceil(Math.random() * 100),
      priority: contribution.priority,
      open: contribution.open
    })
  }
}).populate()
