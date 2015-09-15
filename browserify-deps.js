var browserify = require('browserify');
var fs = require('fs');
var path = require('path');

var b = browserify();

var basePath = path.resolve(process.cwd(), process.argv[2]);
b.add(basePath);

var packages = [];
var other = {
    pkg: {
        name: 'other'
    },
    files: []
};

b.on('file', function (path) {
    var f = {
        path: path,
        size: fs.statSync(path).size
    }

    for (var i = 0; i < packages.length; ++i) {
        var p = packages[i];
        if (f.path.indexOf(p.pkg.__dirname) === 0) {
            p.files.push(f);
            return;
        }
    }

    other.files.push(f);
});
b.on('package', function (pkg) {
    packages.push({
        pkg: pkg,
        files: []
    });
});

function sizeComparator (a, b) {
    return b.size - a.size;
}

function formatNum(num) {
    return num.toFixed(2);
}

function formatSize(size, total) {
    return `${formatNum(size / 1024)}kB` + (total ? ` [${formatNum(size/total * 100)}%]` : '');
}

console.log(`Processing ${basePath}`);

b.bundle(function () {

    if (other.files.length > 0) {
        packages.push(other);
    }

    // Calc the size for each package
    var totalSize = 0;
    packages.forEach(function (p) {

        p.size = p.files.reduce(function (total, f) {
            return f.size + total;
        }, 0);

        p.files.sort(sizeComparator);

        totalSize += p.size;
    });

    packages.sort(sizeComparator)

    console.log('-- Dependencies --');

    console.log(`Total size: ${formatSize(totalSize)}`)

    console.log(packages.map(function (p) {
        var str = `${p.pkg.name}: ${formatSize(p.size, totalSize)}`;
        if (true) {
            str += '\n';
            str += p.files.slice(0,10).map(function (f) {
                return `\t${f.path}: ${formatSize(f.size, p.size)}`;
            }).join('\n');
        }

        return str;
    }).join('\n'));
});