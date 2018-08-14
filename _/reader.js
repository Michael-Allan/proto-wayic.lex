/** reader - Web automation for readers of the dictionary
  *
  *   Tested under Chrome and Firefox only.
  *
  *
  * BASIC USAGE
  * -----------
  *   This program is for use in term documents that are viewed in a web browser.
  *   To use it, append the following line to the end of the *body* element:
  *
  *       <script src='http://reluk.ca/project/wayic/lex/_/reader.js'/>
  *
  *   For more information, see doc.task § Content importer § usage.
  *
  *
  * ENTRY
  * -----
  *   This program starts itself at function *run*, declared below.
  *
  *
  * TROUBLESHOOTING
  * ---------------
  *
  *   Console reporting
  *   -----------------
  *     This program reports problems it detects to the browser’s debugging console.
  *     https://console.spec.whatwg.org/
  *
  *   Requests by ‘file’ scheme
  *   -------------------------
  *     When the user requests a term document from a ‘file’ scheme URL.
  *
  *     Alert reporting
  *     ---------------
  *       When the user requests a term document from a ‘file’ scheme URL,
  *       this program assumes that the user is the author of that document.  Then,
  *       in addition to console reporting, it opens an *alert* window to report malformed content
  *       or any other problem that an author might be able to remedy.
  *
  *     Limitations
  *     -----------
  *       When a Chrome user requests a term document from a ‘file’ scheme URL, any relative *href*
  *       in a content importer will fail to resolve (Chrome 65).  The importer then defaults to its
  *       hyperlink form (likely broken), by which the user can manually access the content (or try).
  *       Security constraints enforced by the browser are the underlying cause of this limitation.
  *
  *       A workaround is the Chrome option ‘--allow-file-access-from-files’.
  *       [AFA in http://reluk.ca/project/wayic/read/readable.css]
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



    /** The pattern of token that indicates a content importer.  This is a RegExp in form.
      * Tested against the *rel* attribute of an HTML *a* element, it tells whether the element
      * is a content importer.
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
        return URIs.normalized( loc ); // To be certain
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



    /** The XML namespace of HTML.
      */
    const NS_HTML = 'http://www.w3.org/1999/xhtml';



    /** Runs this program.
      */
    function run() { runImports( document.body, DOCUMENT_LOCATION ); }



    /** Runs the content importers of the given document branch,
      * trying to replace each with the content it imports.
      *
      *     @param branch (Element)
      *     @param docLoc (string) The location of the branch's document in normal URL form.
      */
    function runImports( branch, docLoc )
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
            const linkURL = new URL( href, docLoc );
            let exDocLoc = URIs.normalizedByURL( linkURL ); // Location of the exporting document
            const fragmentLength = linkURL.hash.length; // Which includes the '#' character
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
                const c = exDocLoc.length - fragmentLength;
                const id = exDocLoc.slice( c + 1 );
                exDocLoc = exDocLoc.slice( 0, c ); // Without fragment
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
            DocumentCache.readNowOrLater( exDocLoc, _import );
            function importFrom( exporter )
            {
              // Import to the present document the exporter, parent of the content to import
              // ------------------------------
                const oldParent = document.importNode( exporter, /*deeply*/true );
                const newParent = importer.parentNode;

              // Run any imported importers
              // --------------------------
                runImports( oldParent, exDocLoc );

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



            /** The location of the document in normal URL form.
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
          * then immediately it calls reader.read, followed by reader.close.
          *
          * Otherwise this function starts a storage process and returns.  If the process eventually
          * succeeds, then it calls reader.read.  Regardless it ends by calling reader.close.
          *
          *     @param docLoc (string) The document location in normal URL form.
          *     @param reader (DocumentReader)
          *
          *     @see URIs#normalized
          */
        expo.readNowOrLater = function( docLoc, reader )
        {
            if( URIs.isDetectedAbnormal( docLoc )) throw URIs.message_abnormal( docLoc );

            let entry = entryMap.get( docLoc );
            if( entry !== undefined ) // Then the document was already requested
            {
                const readers = entry.readers;
                if( readers !== null ) readers.push( reader );
                else notifyReader( reader, entry );
                return;
            }

            const readers = [];
            entry = new DocumentCacheEntry( /*document*/null, docLoc, readers );
            readers.push( reader );
            entryMap.set( docLoc, entry );

          // ===================
          // Configure a request for the document
          // ===================
            const req = new XMLHttpRequest();
            req.open( 'GET', docLoc, /*async*/true ); // Misnomer; opens nothing, only sets config
         // req.overrideMimeType( 'application/xhtml+xml' );
         /// Still it parses to an XMLDocument (Firefox 52), unlike the present document
            req.responseType = 'document';
            req.timeout = docLoc.startsWith('file:')? 2000: 8000; // ms

          // ===========
          // Stand ready to catch the response
          // ===========
            req.onabort = ( _event/*ignored*/ ) =>
            {
                console.warn( 'Document request aborted: ' + docLoc );
            };
            req.onerror = ( _event/*ignored*/ ) =>
            {
                // Parameter *_event* is a ProgressEvent, at least on Firefox,
                // which contains no useful information on the specific cause of the error.

                console.warn( 'Document request failed: ' + docLoc );
            };
            req.onload = ( event ) =>
            {
                const doc = event.target.response;
                entry.document = doc;

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
            req.onloadend = ( _event/*ignored*/ ) =>
            {
                // Parameter *_event* is a ProgressEvent, at least on Firefox, which contains
                // no useful information.  If more information is ever needed, then it might
                // be obtained from req.status, or the fact of a call to req.onerror, above.

              // Notify the waiting readers
              // --------------------------
                const readers = entry.readers;
                entry.readers = null;
                for( const r of readers ) notifyReader( r, entry );
            };
            req.ontimeout = ( e ) =>
            {
                console.warn( 'Document request timed out: ' + docLoc );
            };

          // ================
          // Send the request
          // ================
            req.send();
        };



       // - P r i v a t e ------------------------------------------------------------------------------


        /** Map of document entries (DocumentCacheEntry) keyed by DocumentCacheEntry#location.
          */
        const entryMap = new Map();



        function notifyReader( r, entry )
        {
            const doc = entry.document;
            if( doc !== null ) r.read( entry, doc );
            r.close( entry );
        }



        entryMap.set( DOCUMENT_LOCATION, // Storing the present document
          new DocumentCacheEntry( document, DOCUMENT_LOCATION, /*readers*/null ));
        return expo;

    }() );



   // ==================================================================================================
   //   D o c u m e n t   R e a d e r


    /** A reader of documents.
      */
    class DocumentReader
    {

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
  *  [WDL]  Either 'document.location' or 'window.location', they are identical.
  *         https://www.w3.org/TR/html5/browsers.html#the-location-interface
  */


// Copyright © 2017-2018 Michael Allan and contributors.  Licence MIT.
