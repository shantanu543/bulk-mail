function onOpen () {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu('Bulk Mail')
    .addItem('Send mail', 'sendMail')
    .addToUi()
}

function getColumnHeadings (sheet) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getMaxColumns())
  var rawHeader = headerRange.getValues()
  var header = rawHeader[0]
  var columns = {}

  for (var i in header) {
    if (header[i].trim() !== '') columns[header[i]] = i
  }

  return columns
}

function getDraft () {
  var drafts = GmailApp.getDraftMessages()
  return drafts[0]
}

function main () {
  var quota = MailApp.getRemainingDailyQuota()
  var ui = SpreadsheetApp.getUi()

  ui.alert('[Warning!] Your remaining daily email quota: ' + quota)

  if (quota === 0) {
    ui.alert('You can not send more emails')
    return
  }

  var labelRegex = /{{[\w\s\d]+}}/g
  var sheet = SpreadsheetApp.getActiveSheet()

  var draft = getDraft()

  var subject = draft.getSubject()
  var htmlBodyRaw = draft.getBody()
  var plainBodyRaw = draft.getPlainBody()
  var emailPlaceHolder = draft.getTo()

  var response = ui.alert('Do you want to send drafted message titled "' + subject + '" to ' + (sheet.getLastRow() - 1) + ' people?', ui.ButtonSet.YES_NO)

  if (response === ui.Button.NO) {
    ui.alert('Stopped')
    return
  }

  var count = 0
  var emailMap = {}

  var columns = getColumnHeadings(sheet)
  var dataRange = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn())
  var data = dataRange.getValues()

  for (var i in data) {
    var row = data[i]
    var email = row[columns[emailPlaceHolder]]

    email = email.trim()

    if (email !== '' && !emailMap[email]) {
      var htmlBody = htmlBodyRaw.replace(labelRegex, function (k) {
        var label = k.substring(2, k.length - 2)
        Logger.log('Replaced ' + k + ' with ' + row[columns[label]])
        return row[columns[label]]
      })

      var plainBody = plainBodyRaw.replace(labelRegex, function (k) {
        var label = k.substring(2, k.length - 2)
        return row[columns[label]]
      })

      MailApp.sendEmail(email, subject, plainBody, {
        htmlBody: htmlBody
      })

      emailMap[email] = true

      count++
    }
  }

  ui.alert(count + ' emails sent.')
}

function sendMail () {
  main()
}
