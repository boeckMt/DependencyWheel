var buildMatrixFromPackageJson = function (package_json) {
  var n = Object.keys(package_json.dependencies).length;
  var matrix = [];
  matrix[0] = [0];
  var increment = 0;
  // only the first element depends on others
  for (var i = 1; i < n; i++) {
    matrix[0][i] = 1 + increment;
    increment += 0.001;
    matrix[i] = Array.apply(null, new Array(n)).map(Number.prototype.valueOf, 0);
    matrix[i][0] = 1;
  }
  var packageNames = Object.keys(package_json.dependencies);
  packageNames.unshift(package_json.name);

  return {
    matrix: matrix,
    packageNames: packageNames
  }
};

var buildMatrixFromPackageJsonAndLock = function (package_json, package_json_lock) {
  //var deps = Object.keys(package_json_lock.dependencies).filter((key) => key.match(/@ukis/))
  var deps = Object.keys(package_json.dependencies)

  if (deps.length < 1) {
    console.log('dependency not in package.json');
    return;
  }
  var packages = deps.map((key) => {
    var _package = package_json_lock.dependencies[key];
    _package.name = key;
    if (_package.version.match(/git/) && _package.from) {
      _package.version = _package.from.split('#')[1];
    }
    return _package
  });

  var requiredPackages = [];
  deps.forEach((packagename) => {
    var _package = package_json_lock.dependencies[packagename];
    console.log(_package)
    if (_package.requires) {
      var requiresDeps = Object.keys(_package.requires);
      requiresDeps.forEach((_packagename) => {
        var __package = package_json_lock.dependencies[_packagename]
        __package.name = _packagename;
        console.log(_packagename)
        requiredPackages.push(__package)
      })
    }
  })

  packages = packages.concat(requiredPackages)


  package_json.isMain = true;
  //packages.unshift(package_json);

  var indexByName = {};
  var packageInfo = {};
  var matrix = [];
  var n = 0;
  var v = 0;
  var replaces = {};

  // Compute a unique index for each package name.
  packages.forEach(function (p) {
    packageName = p.name;
    if (!(packageName in indexByName)) {
      packageInfo[n] = {
        name: packageName,
        version: p.version
      }
      indexByName[packageName] = n++;
    }
  });

  // Construct a square matrix counting package requires.
  packages.forEach(function (p) {
    var source = indexByName[p.name];
    var row = matrix[source];
    if (!row) {
      row = matrix[source] = [];
      for (var i = -1; ++i < n;) row[i] = 0;
    }
    for (packageName in p.requires) {
      row[indexByName[packageName]]++;
    }
  });

  // add small increment to equally weighted dependencies to force order
  matrix.forEach(function (row, index) {
    var increment = 0.001;
    for (var i = -1; ++i < n;) {
      var ii = (i + index) % n;
      if (row[ii] == 1) {
        row[ii] += increment;
        increment += 0.001;
      }
    }
  });

  return {
    matrix: matrix,
    packageNames: packageInfo
  }
};
