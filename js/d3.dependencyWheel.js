d3.chart = d3.chart || {};

/**
 * define not known props
 */
d3.chord = d3.chord;
d3.descending = d3.descending;
d3.select = d3.select;
d3.arc = d3.arc;
d3.rgb = d3.rgb;
d3.ribbon = d3.ribbon;

/**
 * @typedef {Object} PackageInfoItem
 * @property {string} name
 * @property {string} version
 * @property {string} sourceDep
 */

/**
 * Dependency wheel chart for d3.js
 *
 * Usage:
 * var chart = d3.chart.dependencyWheel();
 * d3.select('#chart_placeholder')
 *   .datum({
 *      packageNames: [the name of the packages in the matrix],
 *      matrix: [your dependency matrix]
 *   })
 *   .call(chart);
 *
 * // Data must be a matrix of dependencies. The first item must be the main package.
 * // For instance, if the main package depends on packages A and B, and package A
 * // also depends on package B, you should build the data as follows:
 *
 * var data = {
 *   packageNames: ['Main', 'A', 'B'],
 *   matrix: [[0, 1, 1], // Main depends on A and B
 *            [0, 0, 1], // A depends on B
 *            [0, 0, 0]] // B doesn't depend on A or Main
 * };
 *
 * // You can customize the chart width, margin (used to display package names),
 * // and padding (separating groups in the wheel)
 * var chart = d3.chart.dependencyWheel().width(700).margin(150).padding(.02);
 *
 * @author François Zaninotto
 * @license MIT
 * @see https://github.com/fzaninotto/DependencyWheel for complete source and license
 */
d3.chart.dependencyWheel = function (options) {


  var width = window.innerWidth
  if (width > window.innerHeight) {
    width = window.innerHeight
  }
  console.log(window.innerWidth, window.innerHeight)
  var margin = 200;
  var padding = 0.08;
  const colorSource = "hsl(199, 61%, 50%)";
  const colorTarget = "hsl(50, 61%, 50%)"

  function chart(selection) {
    selection.each(function (data) {
      /**
       * @type {Array<number[]>}
       */
      var matrix = data.matrix;
      /**
       * @type {Object.<number,PackageInfoItem>}
       */
      var packageNames = data.packageNames;
      var radius = width / 2 - margin;

      // create the layout
      var chord = d3.chord()
        .padAngle(padding)
        .sortSubgroups(d3.descending);


      const chartPlaceholder = d3.select(this);
      // Select the svg element, if it exists.
      const svg = chartPlaceholder.selectAll("svg").remove().exit().data([data]);

      // create legend
      var LegendEnter = chartPlaceholder.append("svg:svg")
        .attr("class", "legend")
        .attr("width", width / 4)
        .attr("height", 60)
        //first x then y
        .attr("transform", "translate(" + (0) + "," + (10) + ")");
      // Handmade legend
      LegendEnter
        .append("circle").attr("cx", 10).attr("cy", 10).attr("r", 6).style("fill", colorSource);
      LegendEnter
        .append("circle").attr("cx", 10).attr("cy", 30).attr("r", 6).style("fill", colorTarget);
      LegendEnter
        .append("text").attr("x", 20).attr("y", 10).text("Dependencies from Package").style("font-size", "15px").attr("alignment-baseline", "middle");
      LegendEnter
        .append("text").attr("x", 20).attr("y", 30).text("Required - fetched from Package-lock").style("font-size", "15px").attr("alignment-baseline", "middle");
      LegendEnter
        .append("text").attr("x", 10).attr("y", 50).text("Peer-Dependencies are not calculated!").style("font-size", "15px").attr("alignment-baseline", "middle")
      // ---------------------------------


      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg:svg")
        .attr("width", width)
        .attr("height", width - 5)
        .attr("class", "dependencyWheel")
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (width / 2) + ")");

      var arc = d3.arc()
        .innerRadius(radius)
        .outerRadius(radius + 20);

      // function to fill the graph
      const fill = function (d) {
        var index = 0;
        // if (d.index === 0) return '#ccc';

        // color all packages with are source dependencies with another color
        if (packageNames[d.index].name && packageNames[d.index].sourceDep) {
          index = 6;
        }

        // const color = ((packageNames[d.index].name[index].charCodeAt(index) - 97) / 26) * 360;
        // const colorNumber = parseInt(color.toString(), 10);
        // return "hsl(colorNumber, 100%, 29%)";
        if (index === 0) {
          return colorTarget;
        } else {
          return colorSource;
        }
      };

      // Returns an event handler for fading a given chord group.
      var fade = function (opacity) {
        return function (g, i) {

          // set opacity of graph (arcs) 
          gEnter.selectAll(".chord")
            .filter(function (d) {
              // return d.source.index != i && d.target.index != i; // this is selecting other deps not the real deps!!!!!!
              return d.source.index != i;
            })
            .transition()
            .style("opacity", opacity);


          // set opacity of text (deps) 
          var sourceGroups = [];
          gEnter.selectAll(".chord")
            .filter(function (d) {
              if (d.source.index == i) {
                sourceGroups.push(d.target.index);
              }
              // this is selecting other deps not the real deps!!!!!!
              /* if (d.target.index == i) {
                sourceGroups.push(d.target.index);
              } */
            });
          sourceGroups.push(i);
          var length = sourceGroups.length;
          gEnter.selectAll('.group')
            .filter(function (d) {
              for (var i = 0; i < length; i++) {
                if (sourceGroups[i] == d.index) return false;
              }
              return true;
            })
            .transition()
            .style("opacity", opacity);
        };
      };

      var chordResult = chord(matrix);

      var rootGroup = chordResult.groups[0];
      var rotation = -(rootGroup.endAngle - rootGroup.startAngle) / 2 * (180 / Math.PI);

      var g = gEnter.selectAll("g.group")
        .remove().exit()
        .data(chordResult.groups)
        .enter().append("svg:g")
        .attr("class", "group")
        .attr("transform", function (d) {
          return "rotate(" + rotation + ")";
        });

      g.append("svg:path")
        .style("fill", fill)
        .style("stroke", fill)
        .attr("d", arc)
        .style("cursor", "pointer")
        .on("mouseover", fade(0.1))
        .on("mouseout", fade(1));

      g.append("svg:text")
        .each(function (d) {
          d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr("dy", ".35em")
        .attr("class", "text-name")
        .attr("text-anchor", function (d) {
          return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function (d) {
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
            "translate(" + (radius + 26) + ")" +
            (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("cursor", "pointer")
        .html(function (d) {
          return `${packageNames[d.index].name}
          <title>${packageNames[d.index].name} - v${packageNames[d.index].version}</title>
          `;
        })
        .on("mouseover", fade(0.1))
        .on("mouseout", fade(1));

      gEnter.selectAll("path.chord")
        .remove().exit()
        .data(chordResult)
        .enter().append("svg:path")
        .attr("class", "chord")
        .style("stroke", function (d) {
          return d3.rgb(fill(d.source)).darker();
        })
        .style("fill", function (d) {
          return fill(d.source);
        })
        .attr("d", d3.ribbon().radius(radius))
        .attr("transform", function (d) {
          return "rotate(" + rotation + ")";
        })
        .style("opacity", 1);
    });
  }

  chart.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  chart.padding = function (value) {
    if (!arguments.length) return padding;
    padding = value;
    return chart;
  };

  return chart;
};