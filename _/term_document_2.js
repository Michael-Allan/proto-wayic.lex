/** term_document_2.js - Presentation program for term documents, second part
  *
  *   Loaded by the first part, this part carries out the bulk of the program’s functions.
  */
'use strict';
console.assert( (eval('var _tmp = null'), typeof _tmp === 'undefined'),
  'Failed assertion: Strict mode is in effect' );
  // http://www.ecma-international.org/ecma-262/6.0/#sec-strict-mode-code
  // Credit Noseratio, https://stackoverflow.com/a/18916788/2402790
( function()
{

    const CSide = ca_reluk_web_CSide; // Imports from the general Web library

        const DOCUMENT_URI = CSide.DOCUMENT_URI;
        const MALFORMED_PARAMETER = CSide.MALFORMED_PARAMETER;
        const URIs = CSide.URIs;



  /// ==================================================================================================
 ///  P r e l i m i n a r y   d e c l a r a t i o n s
/// ==================================================================================================


    /** Whether the present document was requested from a 'file' scheme URI.
      */
    const wasRequestFileSchemed = document.URL.startsWith( 'file:' );



    /** Whether the user can likely edit the present document.
      */
    const isUserEditor = wasRequestFileSchemed;



    /** Whether it appears that the user would be able to correct faults in this program.
      */
    const isUserProgrammer = wasRequestFileSchemed;

        { CSide.setEnforceConstraints( isUserProgrammer ); }



  /// ==================================================================================================
 ///  S i m p l e   d e c l a r a t i o n s   i n   l e x i c a l   o r d e r
/// ==================================================================================================



    /** The default message for console assertions.
      */
    const A = 'Failed assertion';



    /** The message prefix for console assertions.
      */
    const AA = A + ': ';



    /** The pattern of token that indicates a content importer.  This is a `RegExp` in form.
      * Tested against the `rel` attribute of an HTML `a` element, it tells whether the element
      * is a content importer.
      *
      *     @see RegExp#test
      */
    const CIL_TOKEN_PATTERN = new RegExp( '\\bcontent-repository\\b' );
      // Here adopting the proposed link type of `content-repository`.  `DCTERMS.isReplacedBy`
      // might have been more appropriate, were its use on `a` elements not forbidden.
      // http://microformats.org/wiki/existing-rel-values?oldid=66512#HTML5_link_type_extensions



    /** Makes a requestor for XML or HTML documents, effective by either HTTP or local file access.
      *
      *     @param uri (string) As per 'URI', https://tools.ietf.org/html/rfc3986#section-3
      *
      *     @return (XMLHttpRequest)
      */
    function makeDocumentRequestor( uri )
    {
        // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js

        const isSchemed = URIs.SCHEMED_PATTERN.test( uri );
        if( !isSchemed ) throw MALFORMED_PARAMETER;

        const requestor = new XMLHttpRequest();
          // "XMLHttpRequest" is a misnomer; an instance of `XMLHttpRequest` is not a proper request,
          // rather a requestor which makes a request when its `send` method is called.
        requestor.open( 'GET', uri, /*async*/true );
          // "Developers must not pass false for the `async` argument when *current global object*
          // is a `Window` object."  https://xhr.spec.whatwg.org/#the-open()-method
        requestor.responseType = 'document';
        requestor.timeout = uri.startsWith('file:')? 2000: 8000; // ms, depends on `isSchemed`

      // Failsafe event handlers, defaults for some of https://xhr.spec.whatwg.org/#event-handlers
      // -----------------------
        requestor.onabort = ( _event/*ignored ProgressEvent*/ ) =>
        {
            console.warn( 'Request aborted: ' + uri );
        };
        requestor.onerror = ( _event/*ignored ProgressEvent*/ ) =>
        {
            console.warn( 'Request failed: ' + uri );
        };
        requestor.ontimeout = ( _event/*ignored ProgressEvent*/ ) =>
        {
            console.warn( 'Request timed out: ' + uri );
        };

        return requestor;
    }



    /** Reports malformed content, or any other problem that a user with write access
      * to the document might be able to redress.
      */
    function mal( message )
    {
        if( message === null ) throw "Null parameter";

        console.error( message );
        if( isUserEditor ) alert( message ); // See `./term_document.js` § TESTING AND TROUBLESHOOTING
    }



    /** The XML namespace of HTML.
      */
    const NS_HTML = 'http://www.w3.org/1999/xhtml';



    /** Runs this program.
      */
    function run() { runImports( document.body, DOCUMENT_URI ); }



    /** Runs the content importers of the given document branch,
      * trying to replace each with the content it imports.
      *
      *     @param branch (Element)
      *     @param docURI (string) The location of the branch's document in normal URI form.
      *
      *     @see URIs#normalized
      */
    function runImports( branch, docURI )
    {
        const traversal = document.createNodeIterator( branch, SHOW_ELEMENT );
        for( traversal.nextNode()/*onto the branch element itself*/;; )
        {
            const t = traversal.nextNode();
            if( t === null ) break;

            if( t.localName !== 'a' ) continue;

            const rel = t.getAttribute( 'rel' );
            if( rel === null || !CIL_TOKEN_PATTERN.test(rel) ) continue;

            if( t.namespaceURI !== NS_HTML ) continue;

            const href = t.getAttribute( 'href' );
            if( href === null ) continue;

            const importer = t;
            const linkU = new URL( href, docURI );
            let exDocURI = URIs.normalizedU( linkU ); // Location of the exporting document
            const fragmentLength = linkU.hash.length; // Which includes the '#' character
            let _import;
            class Import extends DocumentReader
            {
                constructor()
                {
                    super();
                    this.didImport = false;
                }
                close( cacheEntry )
                {
                    if( this.didImport ) return;

                    const p = importer.parentNode;
                    const message = document.createElementNS( NS_HTML, 'em' );
                    p.insertBefore( message, importer.nextSibling );
                    p.insertBefore( document.createTextNode( ' ' ), message );
                    message.appendChild( document.createTextNode(
                      'Unable to import content, attempt failed' ));
                    message.style.setProperty( 'margin-left', '1em' );
                }
            }
            if( fragmentLength > 0 )
            {
                const c = exDocURI.length - fragmentLength;
                const id = exDocURI.slice( c + 1 );
                exDocURI = exDocURI.slice( 0, c ); // Without fragment
                _import = new class extends Import
                {
                    read( exDocReg, exDoc )
                    {
                        const s = exDoc.getElementById( id );
                        if( s === null )
                        {
                            mal( "Broken content importer at '#': No such *id*: " + href );
                            return;
                        }

                        importFrom( s );
                        this.didImport = true;
                    }
                };
            }
            else _import = new class extends Import
            {
                read( exDocReg, exDoc )
                {
                    const traversal = exDoc.createTreeWalker( exDoc.documentElement, SHOW_ELEMENT );
                    for( let u = traversal.nextNode();; u = traversal.nextSibling() )
                    {
                        if( u === null )
                        {
                            mal( 'Broken content importer: No *body* element: ' + href );
                            break;
                        }

                        if( u.localName === 'body' && u.namespaceURI === NS_HTML )
                        {
                            importFrom( u );
                            this.didImport = true;
                            break;
                        }
                    }
                }
            };
            DocumentCache.readNowOrLater( exDocURI, _import );
            function importFrom( exporter )
            {
              // Import to the present document the exporter, parent of the content to import
              // ------------------------------
                const oldParent = document.importNode( exporter, /*deeply*/true );
                const newParent = importer.parentNode;

              // Run any imported importers
              // --------------------------
                runImports( oldParent, exDocURI );

              // Insert the content
              // ------------------
                while( oldParent.hasChildNodes() )
                {
                    const c = oldParent.firstChild;
                    if( c.localName === 'script' && c.namespaceURI === NS_HTML )
                    {
                        oldParent.removeChild( c );
                          // Avoiding a rerun of any program, including the present program
                    }
                    else newParent.insertBefore( c, importer ); // Before, ∴ not traversed again
                }

              // Remove the importer, now redundant
              // -------------------
                console.assert( traversal instanceof NodeIterator, AA + 'Traversal is deletion proof' );
                newParent.removeChild( importer );
            }
        }
    }



    const SHOW_ELEMENT = NodeFilter.SHOW_ELEMENT;



  /// ==================================================================================================
 ///  C o m p o u n d   d e c l a r a t i o n s   i n   l e x i c a l   o r d e r
/// ==================================================================================================



        class DocumentCacheEntry
        {
            // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js


            /** Constructs a DocumentCacheEntry.
              *
              *     @see #document
              *     @see #location
              *     @see #readers
              */
            constructor( document, location, readers )
            {
                this._document = document;
                this._location = location;
                this._readers = readers;
            }



            /** The cached document, or null if document storage is pending or failed.
              *
              *     @return (Document)
              */
            get document() { return this._document; }
            set document( _ ) { this._document = _; }



            /** The location of the document in normal URI form.
              *
              *     @return (string)
              *     @see URIs#normalized
              */
            get location() { return this._location; }



            /** The readers to notify of document storage.
              * This property is nulled when notification commences.
              *
              *     @return (Array of DocumentReader)
              */
            get readers() { return this._readers; }
            set readers( _ ) { this._readers = _; }


        }



    /** Store of way declaration documents, including the present document.
      */
    const DocumentCache = ( function()
    {

        const expo = {}; // The public interface of DocumentCache

        // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js



        /** Gives the indicated document to the reader.  If already the document is stored,
          * then immediately it calls `reader.read`, followed by `reader.close`.
          *
          * Otherwise this function starts a storage process and returns.  If the process eventually
          * succeeds, then it calls `reader.read`.  Regardless it ends by calling `reader.close`.
          *
          *     @param docURI (string) The document location in normal URI form.
          *     @param reader (DocumentReader)
          *
          *     @see URIs#normalized
          */
        expo.readNowOrLater = function( docURI, reader )
        {
            if( URIs.isDetectedAbnormal( docURI )) throw URIs.makeMessage_abnormal( docURI );

            let entry = entryMap.get( docURI );
            if( entry !== undefined ) // Then the document was already requested
            {
                const readers = entry.readers;
                if( readers !== null ) readers.push( reader );
                else notifyReader( reader, entry );
                return;
            }

            const readers = [];
            entry = new DocumentCacheEntry( /*document*/null, docURI, readers );
            readers.push( reader );
            entryMap.set( docURI, entry );

          // =====================
          // Configure a requestor for the document
          // =====================
            const requestor = makeDocumentRequestor( docURI );
         // requestor.overrideMimeType( 'application/xhtml+xml' );
         /// Still it parses to an XMLDocument (Firefox 52), unlike the present document

          // ===========
          // Stand ready to catch the response
          // ===========
            requestor.onload = ( event ) => // not by `addEventListener` [XHR]
            {
                const doc = event.target.response;
                entry.document = doc;
            };
            requestor.onloadend = ( _event/*ignored ProgressEvent*/ ) =>
            {
                // The given `ProgressEvent` holds slight information.  More might be got
                // from the properties and methods of the requestor itself, or the fact
                // of calls to other event handlers.

              // Notify the waiting readers
              // --------------------------
                const readers = entry.readers;
                entry.readers = null;
                for( const r of readers ) notifyReader( r, entry );
            };

          // ================
          // Send the request
          // ================
            requestor.send();
        };



       // - P r i v a t e ------------------------------------------------------------------------------


        /** Map of document entries (DocumentCacheEntry) keyed by `DocumentCacheEntry#location`.
          */
        const entryMap = new Map();



        function notifyReader( r, entry )
        {
            const doc = entry.document;
            if( doc !== null ) r.read( entry, doc );
            r.close( entry );
        }



        entryMap.set( DOCUMENT_URI, // Storing the present document
          new DocumentCacheEntry( document, DOCUMENT_URI, /*readers*/null ));
        return expo;

    }() );



   // ==================================================================================================
   //   D o c u m e n t   R e a d e r


    /** A reader of documents.
      */
    class DocumentReader
    {
        // Changing?  sync'd ← http://reluk.ca/project/wayic/read/readable.js

        /** Closes this reader.
          *
          *     @param cacheEntry (DocumentCacheEntry)
          */
        close( cacheEntry ) {}


        /** Reads the document.
          *
          *     @param cacheEntry (DocumentCacheEntry)
          *     @param doc (Document)
          */
        read( cacheEntry, doc ) {}

    }



   // ==============

    run();

}() );


/** NOTE
  * ----
  *  [XHR]  Registering the event handler instead by `addEventListener` has caused failures.
  *         See [XHR] in <http://reluk.ca/project/wayic/read/readable.js>.
  */


// Copyright © 2017-2019 Michael Allan and contributors.  Licence MIT.
