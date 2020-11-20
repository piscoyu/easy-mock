'use strict'

const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const moment = require('moment')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const config = require('config')

const uploadConf = config.get('upload')

module.exports = class UtilController {
  /**
   * 文件上传
   * @param Object ctx
   */

  static async upload (ctx) {
    const origin = ctx.request.origin
    const expireDay = uploadConf.expire.day
    const hash = crypto.createHash('md5')
    const date = moment().format('YYYY/MM/DD')
    const uploadDir = path.resolve(__dirname, uploadConf.dir, date)
    const file = ctx.request.body.files.file
    const suffix = path.extname(file.name).toLowerCase()
    const now = (new Date()).getTime()
    const fileName = hash.update(now + Math.random().toString()).digest('hex') + suffix

    let reader, stream

    /* istanbul ignore if */
    if (!fs.existsSync(uploadDir)) mkdirp.sync(uploadDir)

    if (uploadConf.types.indexOf(suffix) === -1) {
      ctx.body = ctx.util.refail(`上传失败，仅支持 ${uploadConf.types.join('/').replace(/\./g, '')} 文件类型`)
      return
    }

    if (file.size > uploadConf.size) {
      ctx.body = ctx.util.refail('上传失败，超过限定大小')
      return
    }

    reader = fs.createReadStream(file.path)
    stream = fs.createWriteStream(path.join(uploadDir, fileName))
    reader.pipe(stream)

    ctx.body = ctx.util.resuccess({
      path: new URL(path.join('upload', date, fileName), origin).href,
      expire: expireDay > 0
        ? moment().add(expireDay, 'days').format('YYYY-MM-DD 00:00:00')
        : /* istanbul ignore next */ -1
    })
  }
}
