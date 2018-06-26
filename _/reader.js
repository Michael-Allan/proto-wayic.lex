/** reader - Web automation for readers of the dictionary
  *
  *   Tested under Chrome and Firefox only.
  *
  *
  * BASIC USAGE
  * -----------
  *   This program is for use in word files.  To use it, append the following line
  *   to the end of the *body* element:
  *
  *       <script src='http://reluk.ca/project/wayic/lex/_/reader.js'/>
  *
  *   If you load a word file into the browser locally (on a ‘file’ scheme URL),
  *   then this program is likely to fail.  Read the troubleshooting section below.
  *
  *   See also ../doc.task § content insertion link § usage.
  *
  *
  * ENTRY
  * -----
  *   This program starts itself at function *run*, declared below.
  *
  *
  * TROUBLESHOOTING
  * ---------------
  *   This program reports problems it detects to the browser’s debugging console. [CONS]
  *
  *   Direct loading from the file system
  *   - - - - - - - - - - - - - - - - - -
  *   When a word file is loaded into the browser on a ‘file’ scheme URL, this program assumes
  *   you are its author.  Then it will open an *alert* window for any problem such as
  *   malformed content, or anything else that an author might be able to remedy.
  *
  *   Note that content insertion links may fail to resolve under a ‘file’ scheme URL,
  *   appearing instead as hyperlinks with ‘content’ labels.  Usually this can be corrected
  *   by copying the word file to a temporary file with ‘.xht’ extension.  For example,
  *   if you were trying to read the word file named ‘waycast’:
  *
  *       $ cp  waycast  _wayic.lex.word_copy.xht
  *
  *   Now retest it by loading ‘_wayic.lex.word_link.xht’ into the browser.  If the file system allows,
  *   then hard linking will often be more convenient for troubleshooting purposes than copying:
  *
  *       $ ln  waycast  _wayic.lex.word_link.xht
  *
  *
  * NOTES  (continued at bottom)
  * -----
  */
'use strict';
console.assert( (eval('var _tmp = null'), typeof _tmp === 'undefined'),
  'Failed assertion: Strict mode is in effect' );
  // http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-code
  // Credit Noseratio, https://stackoverflow.com/a/18916788/2402790
( function()
{

  /// ==================================================================================================
 ///  P r e l i m i n a r y   d e c l a r a t i o n s
/// ====================================================================================================


    /** Whether the present document was requested from a 'file' scheme URL.
      */
    const wasRequestFileSchemed = document.URL.startsWith( 'file:' );



    /** Whether the user can likely edit the present document.
      */
    const isUserEditor = wasRequestFileSchemed;



    /** Whether it appears that the user would be unable to correct faults in this program.
      */
    const isUserNonProgrammer = !wasRequestFileSchemed;



    /** Whether to enforce program constraints whose violations are expensive to detect.
      */
    const toEnforceCostlyConstraints = !isUserNonProgrammer;



   // ==================================================================================================


    /** Dealing with Uniform Resource Identifiers.
      *
      *     @see https://tools.ietf.org/html/rfc3986
      */
    const URIs = ( function()
    {

        const expo = {}; // The public interface of URIs



        /** Returns the same URI, but without a fragment.
          */
        expo.defragmented = function( uri )
        {
            // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js
            const c = uri.lastIndexOf( '#' );
            if( c >= 0 ) uri = uri.slice( 0, c );
            return uri;
        };



        /** Answers whether the given URI is detected to have an abnormal form,
          * where such detection depends on whether *toEnforceCostlyConstraints*.
          *
          *     @see #normalize
          */
        expo.isDetectedAbnormal = function( uri )
        {
            if( toEnforceCostlyConstraints )
            {
                try{ return uri !== expo.normalized(uri) }
                catch( x ) { console.warn( 'Suppressed exception: ' + x ); } // E.g. if *uri* relative
            }
            return false;
        };



        /** Returns a message that the given URI is not in normal form.
          */
        expo.message_abnormal = function( uri ) { return 'Not in normal form:' + uri; };



        /** Returns the full form, normalized equivalent of the given URI reference.
          * This is a convenience function.  If you already have an instance of URL,
          * then a direct call to *normalizedByURL* will be more efficient.
          *
          *     @param ref (string) The URI reference.
          *       See https://tools.ietf.org/html/rfc3986#section-4.1, URI-reference
          *     @param base (string, optional unless *ref* is relative)
          *       See https://tools.ietf.org/html/rfc3986#section-5.1, base URI
          *
          *     @return (string)
          *     @throw Error if *ref* is relative and *base* is undefined.
          */
        expo.normalized = function( ref, base ) { return expo.normalizedByURL( new URL( ref, base )); };



        /** Returns the normalized URI (string) formed by the given instance of URL.
          */
        expo.normalizedByURL = function( u ) { return u.href; };



        return expo;

    }() );



  /// ==================================================================================================
 ///  S i m p l e   d e c l a r a t i o n s   i n   l e x i c a l   o r d e r
/// ==================================================================================================



    /** The default message for console assertions.
      */
    const A = 'Failed assertion';



    /** The message prefix for console assertions.
      */
    const AA = A + ': ';



    /** The pattern of token that indicates a content insertion link.  This is a RegExp in form.
      * Tested against the *rel* attribute of an HTML *a* element, it tells whether the element
      * is a content insertion link.
      *
      *     @see RegExp#test
      */
    const CIL_TOKEN_PATTERN = new RegExp( '\\bcontent-repository\\b' );
      // Here adopting the proposed link type of *content-repository*.  *DCTERMS.isReplacedBy*
      // might have been more appropriate, were its use on *a* elements not forbidden.
      // http://microformats.org/wiki/existing-rel-values?oldid=66512#HTML5_link_type_extensions



    /** The location of present document (string) in normal URL form.
      *
      *     @see URIs#normalized
      */
    const DOCUMENT_LOCATION = ( ()=>
    {
        // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js
        const wloc = window.location; // [WDL]
        let loc = wloc.toString();
        if( wloc.hash ) loc = URIs.defragmented( loc );
        return URIs.normalized( loc ); // To be sure
    })();



    /** Reports malformed content, or any other problem that a user with write access
      * to the document might be able to redress.
      */
    function mal( message )
    {
        if( message === null ) throw "Null parameter";

        console.error( message );
        if( isUserEditor ) alert( message ); // See § TROUBLESHOOTING
    }



    /** Resolves each content insertion link within the given target node by replacing it
      * with the content of its referent.
      *
      *     @param target (Node)
      *     @param docLoc (string) The target document location in normal URL form.
      */
    function resolveInsertions( target, docLoc )
    {
        const traversal = document.createNodeIterator( target, SHOW_ELEMENT );
        for( traversal.nextNode()/*onto the target element itself*/;; )
        {
            const t = traversal.nextNode();
            if( t === null ) break;

            if( t.localName !== 'a' ) continue;

            const rel = t.getAttribute( 'rel' );
            if( rel === null || !CIL_TOKEN_PATTERN.test(rel) ) continue;

            if( t.namespaceURI !== NS_HTML ) continue;

            const href = t.getAttribute( 'href' );
            if( href === null ) continue;

            const insertionLink = t;
            const linkURL = new URL( href, docLoc );
            let sdocLoc = URIs.normalizedByURL( linkURL ); // Location of the source document
            const fragmentLength = linkURL.hash.length; // Which includes the '#' character
            let sourceReader;
            if( fragmentLength > 0 )
            {
                const c = sdocLoc.length - fragmentLength;
                const id = sdocLoc.slice( c + 1 );
                sdocLoc = sdocLoc.slice( 0, c ); // Without fragment
                sourceReader = new class extends DocumentReader
                {
                    read( sdocReg, sdoc )
                    {
                        const s = sdoc.getElementById( id );
                        if( s !== null ) insertFrom( s );
                        else mal( "Broken content insertion link at '#': No such *id*: " + href );
                    }
                };
            }
            else sourceReader = new class extends DocumentReader
            {
                read( sdocReg, sdoc )
                {
                    const traversal = sdoc.createTreeWalker( sdoc.documentElement, SHOW_ELEMENT );
                    for( let u = traversal.nextNode();; u = traversal.nextSibling() )
                    {
                        if( u === null )
                        {
                            mal( 'Broken content insertion link: No *body* element: ' + href );
                            break;
                        }

                        if( u.localName === 'body' && u.namespaceURI === NS_HTML )
                        {
                            insertFrom( u );
                            break;
                        }
                    }
                }
            };
            Documents.readNowOrLater( sdocLoc, sourceReader );
            function insertFrom( sdocSourceElement )
            {
              // Import the source element, the parent of the content to insert
              // -------------------------
                const oldParent = document.importNode( sdocSourceElement, /*deeply*/true );
                const newParent = insertionLink.parentNode;

              // Resolve any insertions it contains
              // ----------------------
                resolveInsertions( oldParent, sdocLoc );

              // Insert its content
              // ------------------
                while( oldParent.hasChildNodes() )
                {
                    const c = oldParent.firstChild;
                    if( c.localName === 'script' && c.namespaceURI === NS_HTML )
                    {
                        oldParent.removeChild( c );
                          // Avoiding a rerun of any program, including the present program
                    }
                    else newParent.insertBefore( c, insertionLink ); // Before, ∴ not traversed again
                }

              // Remove the insertion link, now redundant
              // -------------------------
                function removeLink() { newParent.removeChild( insertionLink ); }
             // if( traversal.currentNode !== insertionLink || insertionLink.nextSibling === null )
             // {
             //     removeLink();
             // }
             // else Promise.resolve().then( removeLink ); // Later, when it will not trap the traversal
             /// But only a TreeWalker traversal could be trapped in that way, not a NodeIterator
                console.assert( traversal instanceof NodeIterator, A );
                removeLink();
            }
        }
    }



    /** The XML namespace of HTML.
      */
    const NS_HTML = 'http://www.w3.org/1999/xhtml';



    /** Runs this program.
      */
    function run() { resolveInsertions( document.body, DOCUMENT_LOCATION ); }



    const SHOW_ELEMENT = NodeFilter.SHOW_ELEMENT;



  /// ==================================================================================================
 ///  C o m p o u n d   d e c l a r a t i o n s   i n   l e x i c a l   o r d e r
/// ==================================================================================================



    /** A reader of documents.
      */
    class DocumentReader // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js
    {

        /** Closes this reader.
          *
          *     @param docReg (DocumentRegistration)
          */
        close( docReg ) {}


        /** Reads the document.
          *
          *     @param docReg (DocumentRegistration)
          *     @param doc (Document)
          */
        read( docReg, doc ) {}

    }



   // ==================================================================================================


    /** The generalized record of a document.
      */
    class DocumentRegistration // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js
    {

        constructor( location, doc = null )
        {
            this._location = location;
            this._document = doc;
        }


        /** The registered document, or null if the document could not be retrieved.
          */
        get document() { return this._document; }
        set document( d ) { this._document = d; }


        /** The location of the document in normal form.
          */
        get location() { return this._location; }

    }



   // ==================================================================================================


    /** Dealing with documents at large, not only the present document.
      */
    const Documents = ( function() // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js
    {

        const expo = {}; // The public interface of Documents



        /** Tries to retrieve the indicated document for the given reader.  If *docLoc* indicates
          * the present document, then immediately the reader is given the present document as is,
          * followed by a call to reader.close.
          *
          * <p>Otherwise this method starts a retrieval process.  It may return early and leave
          * the process to finish later.  If the process succeeds, then it normalizes all namespaceless
          * *href* attributes of the document and calls reader.read.
          * Regardless it always finishes by calling reader.close.</p>
          *
          *     @param docLoc (string) The document location in normal URL form.
          *     @param reader (DocumentReader)
          *
          *     @see URIs#normalized
          */
        expo.readNowOrLater = function( docLoc, reader )
        {
            if( URIs.isDetectedAbnormal( docLoc )) throw URIs.message_abnormal( docLoc );

            const entry = registry.get( docLoc );
            if( entry !== undefined )
            {
                if( entry instanceof DocumentRegistration ) notifyReader( reader, entry, entry.document );
                else // Registration still pends
                {
                    console.assert( entry instanceof Array, A );
                    entry/*readers*/.push( reader ); // Await the registration
                }
                return;
            }

            const readers = [];
            registry.set( docLoc, readers );
            readers.push( reader );

          // Configure a document request
          // ----------------------------
            const req = new XMLHttpRequest();
            req.open( 'GET', docLoc, /*asynchronous*/true ); // Misnomer, opens nothing, only sets config
         // req.overrideMimeType( 'application/xhtml+xml' );
         /// Still it parses to an XMLDocument (Firefox 52), not to HTML like the present document
            req.responseType = 'document';
            req.timeout = docLoc.startsWith('file:')? 2000: 8000; // ms

          // Stand by for the response
          // -------------------------
            {
                const docReg = new DocumentRegistration( docLoc );

              // abort
              // - - -
                req.onabort = function( e ) { console.warn( 'Document request aborted: ' + docLoc ); }

              // error
              // - - -
                /** @param e (Event) Unfortunately this is a mere ProgressEvent, at least on Firefox,
                  *   which contains no useful information on the specific cause of the error.
                  */
                req.onerror = function( e ) { console.warn( 'Document request failed: ' + docLoc ); }

              // load
              // - - -
                req.onload = function( e )
                {
                    const doc = e.target.response;
                    docReg.document = doc;

                  // Normalize *href* attributes
                  // ---------------------------
                    const traversal = doc.createNodeIterator( doc, SHOW_ELEMENT );
                    for( traversal.nextNode()/*onto the document node itself*/;; )
                    {
                        const t = traversal.nextNode();
                        if( t === null ) break;

                        const href = t.getAttributeNS( null, 'href' );
                        if( href === null ) continue;

                        const hrefN = URIs.normalized( href, docLoc );
                        if( hrefN !== href ) t.setAttributeNS( null, 'href', hrefN );
                    }
                };

              // load end
              // - - - - -
                /** @param e (Event) This is a mere ProgressEvent, at least on Firefox,
                  *   which itself contains no useful information.
                  */
                req.onloadend = function( e )
                {
                    // Parameter *e* is a ProgressEvent, which contains no useful information.
                    // If more information is ever needed, then it might be obtained from req.status,
                    // or the mere fact of a call to req.error (see listener req.onerror, above).

                  // Register the document
                  // ---------------------
                    registry.set( docLoc, docReg );

                  // Notify the waiting readers
                  // --------------------------
                    const doc = docReg.document;
                    for( const r of readers ) notifyReader( r, docReg, doc );
                }

              // time out
              // - - - - -
                req.ontimeout = function( e ) { console.warn( 'Document request timed out: ' + docLoc ); }
            }

          // Send the request
          // ----------------
            req.send();
        };



       // - P r i v a t e ------------------------------------------------------------------------------


        function notifyReader( r, docReg, doc )
        {
            if( doc !== null ) r.read( docReg, doc );
            r.close( docReg );
        }



        const PRESENT_DOCUMENT_REGISTRATION = new DocumentRegistration( DOCUMENT_LOCATION, document );



        /** Map of pending and complete document registrations, including that of the present document.
          * The entry key is DocumentRegistration#location.  The value is either the registration itself
          * or the readers (Array of DocumentReader) that await it.
          */
        const registry = new Map().set( DOCUMENT_LOCATION, PRESENT_DOCUMENT_REGISTRATION );



        return expo;

    }() );




   // ==============

    run();

}() );


/** NOTES
  * -----
  *  [CONS]  https://console.spec.whatwg.org/
  *
  *  [WDL]  Either 'document.location' or 'window.location', they are identical.
  *         https://www.w3.org/TR/html5/browsers.html#the-location-interface
  */


// Copyright © 2017-2018 Michael Allan and contributors.  Licence MIT.
