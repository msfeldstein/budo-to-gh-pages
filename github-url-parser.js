const path = require('path')

module.exports = function(url) {
  if (url.indexOf('git@') == 0) {
    const path = url.split(':')[1]
    const [username, project] = path.split('/')
    return {
      username,
      project: project.substring(0, project.length - 4)
    }
  } else {
    const [protocol, empty, github, username, project] = path.split('/')
    return {
      username,
      project: project.substring(0, project.length - 4)
    }
  }
}