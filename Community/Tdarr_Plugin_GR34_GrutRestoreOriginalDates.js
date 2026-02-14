/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
function details() {
  return {
    id: "Tdarr_Plugin_GR34_GrutRestoreOriginalDates",
    Stage: "Post-processing",
    Name: "Grut-Restore Original File Date",
    Type: "Date",
    Operation: "Restore",
    Description: 'This plugin can restore dates (atime/mtime) of the original media from a JSON file. Should be used as LAST plugin in the stack. To save the original date, use Tdarr_Plugin_GR34_GrutSaveOriginalDates.\n\n',
    Version: '0.1',
    Link: '',
    Tags: 'post-processing,original,date,restore',
    Inputs: [
      {
        name: 'deleteDateFile',
        tooltip: `Delete the file where dates are saved after restore. (default : false)
              \\nOptional.
              \\nExample:\\n
              true
              \\nExample:\\n
              false
              \\nDefault:\\n
              false
              `,
      },
      {
        name: 'debug',
        tooltip: `print some debug output in node log (ie docker logs...).
              \\nOptional.
              \\nExample:\\n
              true
              \\nExample:\\n
              false
              \\nDefault:\\n
              false
              `,
      },
      {
        name: 'dates_dir',
        tooltip: `Path to save .dates files to`,
      },
    ],
  };
}


function print_debug(debug, message) {
  prefix = new Date().toISOString() + " - " + "Tdarr_Plugin_GR34_GrutRestoreOriginalDates - "
  if (debug)
    console.log(prefix + message)
}

function plugin(file, librarySettings, inputs) {
  const response = {
    file,
    removeFromDB: false,
    updateDB: true,
  };

  fs = require('fs');
  path = require('path');

  let debug = false
  if (inputs && inputs.debug && inputs.debug.toLowerCase() === 'true')
    debug = true

  let deleteDateFile = false
  if (inputs && inputs.deleteDateFile && inputs.deleteDateFile.toLowerCase() === 'true')
    deleteDateFile = true

  let date_file
  let data
  let infostats
  print_debug(debug, '###### Restoring original dates for ' + file.file)
  response.infoLog += '###### Restoring original dates for ' + file.file + "\n"

  parsed_file=path.parse(file.file);

  if (inputs && inputs.dates_dir)
      date_file=`${inputs.dates_dir}${path.posix.sep}${parsed_file.name}.dates`
  else
      date_file=`${parsed_file.dir}${path.posix.sep}${parsed_file.name}.dates`

  print_debug(debug, "Read dates from " + date_file)
  response.infoLog += "Read dates from " + date_file + "\n"
  try {
    if(fs.existsSync(date_file)) {
      print_debug(debug, "The file exists.");
    } else {
      print_debug(debug, 'The file does not exist. Skipping..');
      response.infoLog += "The file does not exist. Skipping..\n"
      return  response
    }
  } catch (err) {
    print_debug(debug, `Error while checking file existence the dates: ${err}`)
  }

  try {
    print_debug(debug, `test read file`);
    data = fs.readFileSync(date_file, 'utf8');

    // parse JSON string to JSON object
    infostats = JSON.parse(data);

    print_debug(debug, "Original atime = " + infostats.atime)
    print_debug(debug, "Original mtime = " + infostats.mtime)
    response.infoLog += "Original atime = " + infostats.atime + ", Original mtime = " + infostats.mtime + "\n"

  } catch (err) {
    print_debug(debug, `Error reading file ${date_file} from disk: ${err}`);
    return reponse
  }

  try {
    print_debug(debug, "Setting atime and mtime for " + file.file)
    print_debug(debug, "      atime=" + new Date(infostats.atime))
    print_debug(debug, "      mtime=" + new Date(infostats.mtime))
    response.infoLog += "Setting atime and mtime...\n"
    fs.utimesSync(file.file, new Date(infostats.atime), new Date(infostats.mtime));
  } catch (err) {
    print_debug(debug, `Error while setting the dates: ${err}`);
    return response
  }

  if(deleteDateFile){
    try {
      print_debug(debug, `Deleting file ${date_file}`)
      response.infoLog += `Deleting file ${date_file}` + "\n"
      fs.unlinkSync(date_file)
      //file removed
    } catch(err) {
      print_debug(debug, `Error while deleting the file : ${err}`);
    }
  }

  print_debug(debug, '###### End Processing ' + file.file)
  print_debug(debug, '')
  print_debug(debug, '')

  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;
