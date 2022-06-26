// Copyright (C) 2020, Jeroen K.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


import url from "url";
import http from "http";
import events from "events";
import util from "util";

const extractBoundary = contentType => {
    contentType = contentType.replace(/\s+/g, '');

    let startIndex = contentType.indexOf('boundary=');
    let endIndex = contentType.indexOf(';', startIndex);
    if (endIndex == -1) { //boundary is the last option
        // some servers, like mjpeg-streamer puts a '\r' character at the end of each line.
        if ((endIndex = contentType.indexOf('\r', startIndex)) == -1) {
            endIndex = contentType.length;
        }
    }
    return contentType.substring(startIndex + 9, endIndex).replace(/"/gi, '').replace(/^\-\-/gi, '');
}



// MjpegProxy Module
export default class MjpegProxy {
    constructor(mjpegUrl) {
        events.EventEmitter.call(this);

        if (!mjpegUrl) throw new Error('Please provide a source MJPEG URL');

        this.mjpegOptions = url.parse(mjpegUrl);
        this.mjpegUrl = mjpegUrl;

        this.audienceResponses = [];
        this.newAudienceResponses = [];

        this.boundary = null;
        this.globalMjpegResponse = null;
        this.mjpegRequest = null;
    }


    proxyRequest(req, res) {
        if (res.socket == null) {
            return;
        }

        this.emit("streamstart", "[MjpegProxy] Started streaming " + this.mjpegUrl + " , users: " + (this.audienceResponses.length + 1));

        // There is already another client consuming the MJPEG response
        if (this.mjpegRequest !== null) {

            this._newClient(req, res);
        } else {
            // Send source MJPEG request
            this.mjpegRequest = http.request(this.mjpegOptions, mjpegResponse => {
                // console.log('request');
                this.globalMjpegResponse = mjpegResponse;
                this.boundary = extractBoundary(mjpegResponse.headers['content-type']);

                this._newClient(req, res);

                let lastByte1 = null;
                let lastByte2 = null;

                mjpegResponse.on('data', chunk => {
                    // Fix CRLF issue on iOS 6+: boundary should be preceded by CRLF.
                    let buff = Buffer.from(chunk);
                    if (lastByte1 != null && lastByte2 != null) {
                        let oldheader = '--' + this.boundary;

                        let p = buff.indexOf(oldheader);

                        if (p == 0 && !(lastByte2 == 0x0d && lastByte1 == 0x0a) || p > 1 && !(chunk[p - 2] == 0x0d && chunk[p - 1] == 0x0a)) {
                            let b1 = chunk.slice(0, p);
                            let b2 = new Buffer('\r\n--' + this.boundary);
                            let b3 = chunk.slice(p + oldheader.length);
                            chunk = Buffer.concat([b1, b2, b3]);
                        }
                    }

                    lastByte1 = chunk[chunk.length - 1];
                    lastByte2 = chunk[chunk.length - 2];

                    for (let i = this.audienceResponses.length; i--;) {
                        let res = this.audienceResponses[i];

                        // First time we push data... lets start at a boundary
                        if (this.newAudienceResponses.indexOf(res) >= 0) {
                            let p = buff.indexOf('--' + this.boundary);
                            if (p >= 0) {
                                res.write(chunk.slice(p));
                                this.newAudienceResponses.splice(this.newAudienceResponses.indexOf(res), 1); // remove from new
                            }
                        } else {
                            res.write(chunk);
                        }
                    }
                });
                mjpegResponse.on('end', () => {
                    // console.log("...end");
                    for (let i = this.audienceResponses.length; i--;) {
                        let res = this.audienceResponses[i];
                        res.end();
                    }
                    this.emit("streamstop", "[MjpegProxy] 0 Users, Stopping stream " + this.mjpegUrl);

                });
                mjpegResponse.on('close', () => {
                    // console.log("...close");
                });
            });

            this.mjpegRequest.on('error', e => {
                //console.error('problem with request: ', e);
                this.emit("error", { msg: e, url: this.mjpegUrl });
            });
            this.mjpegRequest.end();
        }
    }

    _newClient(req, res) {
        res.writeHead(200, {
            'Expires': 'Mon, 01 Jul 1980 00:00:00 GMT',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Content-Type': 'multipart/x-mixed-replace;boundary=' + this.boundary
        });

        this.audienceResponses.push(res);
        this.newAudienceResponses.push(res);

        res.socket.on('close', () => {
            // console.log('exiting client!');

            this.audienceResponses.splice(this.audienceResponses.indexOf(res), 1);
            if (this.newAudienceResponses.indexOf(res) >= 0) {
                this.newAudienceResponses.splice(this.newAudienceResponses.indexOf(res), 1); // remove from new
            }

            if (this.audienceResponses.length == 0) {
                this.mjpegRequest = null;
                try {
                    this.globalMjpegResponse.destroy();
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }
}



util.inherits(MjpegProxy, events.EventEmitter);

