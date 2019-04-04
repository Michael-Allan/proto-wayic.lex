/** term_document.js - Presentation program for term documents
  *
  *   Summoned by a `script` element in each term document of the dictionary, this program runs on
  *   the client side — in the reader’s Web browser — where it manipulates the term document’s DOM.
  *
  *   Tested under Chrome and Firefox only.
  *
  *
  * BASIC USE
  * ---------
  *   This program is for use in term documents that are viewed in a Web browser.
  *   To use it, append the following line to the end of the `body` element:
  *
  *       <script src='http://reluk.ca/project/wayic/lex/_/term_document.js'/>
  *
  *   For further information on basic use, see ./doc.task § content importer § use.
  *
  *
  * ENTRY
  * -----
  *   This program starts itself at function `run`, declared below.
  *
  *
  * TESTING AND TROUBLESHOOTING
  * ---------------------------
  *
  *   Console reporting
  *   -----------------
  *     This program reports problems it detects to the browser’s debugging console.
  *     https://console.spec.whatwg.org/
  *
  *   Alert reporting under ‘file’ scheme
  *   -----------------------------------
  *     When the user requests a term document from a ‘file’ scheme URI,
  *     this program assumes that the user is the author of that document.  Then,
  *     in addition to console reporting, it opens an *alert* window to report malformed content
  *     or any other problem that an author might be able to remedy.
  *
  *   Limitations under ‘file’ scheme
  *   -------------------------------
  *     When a Chrome user requests a term document from a ‘file’ scheme URI, any relative `href`
  *     in a content importer will fail (Chrome version 65), leaving the importer in its default,
  *     hyperlink trigger form.  Security constraints enforced by Chrome are the underlying cause.
  *     A workaround is its `--allow-file-access-from-files` option. [AFA]
  *
  *
  * NOTE  (see at bottom)
  * ----
  */
'use strict';
console.assert( (eval('var _tmp = null'), typeof _tmp === 'undefined'),
  'Failed assertion: Strict mode is in effect' );
  // http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-code
  // Credit Noseratio, https://stackoverflow.com/a/18916788/2402790
( function()
{


    /** Runs this program.
      *
      *     @param relukDir (string) Location of the `reluk.ca` projects directory in URI reference
      *       form.  See `URI-reference`, https://tools.ietf.org/html/rfc3986#section-4.1
      */
    function run( relukDir )
    {
        summonScript( relukDir + 'web/client_side.js', ( _Event ) =>
        {
            if( ca_reluk_web_cSide === undefined ) return; // Script failed

          // Locate the source directory of the present program, whence it was summoned
          // --------------------------------------------------
            for( let e = document.body.lastElementChild; e != null; e = e.previousElementSibling )
            {
                if( e.localName !== 'script' ) continue;

                let programLoc = e.src;
                if( !programLoc.endsWith( '/term_document.js' )) continue;

              // Summon the second part of the present program from the same source directory
              // ----------------------
                programLoc = programLoc.slice(0,-3) + '_2.js'; // From one sibling there to another
                summonScript( programLoc );
            }
        });
    }



    /** Requests the loading of another JavaScript program or library into the present document.
      *
      *     @param loc (string) Location of the program or library in URI reference form.
      *       See `URI-reference`, https://tools.ietf.org/html/rfc3986#section-4.1
      *     @param callback (Function) What to call when the script loads, or null to call nothing.
      */
    function summonScript( loc, callback = null )
    {
        const s = document.body.appendChild(
          document.createElementNS( 'http://www.w3.org/1999/xhtml', 'script' ));
        s.setAttribute( 'src', loc );
        if( callback !== null ) s.addEventListener( 'load', callback );
    }



   // ==============

    run(
      'http://reluk.ca/project/'
   // '/LOCAL/WORKING/COPY/' // TEST purposes only
      );

}() );


/** NOTE
  * ----
  *  [AFA]  Chrome option `--allow-file-access-from-files`.
  *         https://peter.sh/experiments/chromium-command-line-switches/#allow-file-access-from-files
  *         https://code.google.com/p/chromium/codesearch#chromium/src/content/public/common/content_switches.cc&q=kAllowFileAccessFromFiles&sq=package:chromium&type=cs
  *
  *         Security implications: https://stackoverflow.com/questions/29371600
  */


// Copyright © 2017-2019 Michael Allan and contributors.  Licence MIT.
