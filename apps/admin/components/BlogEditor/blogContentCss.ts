// How a blog post body looks on the storefront. Used by the admin editor canvas and the HTML-mode
// preview so the admin sees what customers will see.
// KEEP IN SYNC with the `.blog-content` block in apps/web/app/globals.css.
export const BLOG_CONTENT_CSS = `
.blog-content { color: rgba(245,245,245,.9); font-family: var(--font-roboto), system-ui, sans-serif; font-size: 1.0625rem; line-height: 1.7; overflow-wrap: break-word; }
.blog-content > :first-child { margin-top: 0; }
.blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 { color: #f5f5f5; font-weight: 600; line-height: 1.2; margin: 1.6em 0 .6em; }
.blog-content h1 { font-size: 2.25rem; }
.blog-content h2 { font-size: 1.75rem; }
.blog-content h3 { font-size: 1.375rem; }
.blog-content h4 { font-size: 1.125rem; }
.blog-content p { margin: 0 0 1em; }
.blog-content a { color: #f0ad3d; text-decoration: underline; text-underline-offset: 2px; }
.blog-content strong, .blog-content b { font-weight: 700; }
.blog-content ul, .blog-content ol { margin: 0 0 1em; padding-left: 1.5em; }
.blog-content ul { list-style: disc; }
.blog-content ol { list-style: decimal; }
.blog-content li { margin: .25em 0; }
.blog-content li > p { margin: 0; }
.blog-content blockquote { margin: 1.5em 0; padding: .25em 0 .25em 1em; border-left: 3px solid #c8102e; color: rgba(245,245,245,.8); font-style: italic; }
.blog-content img { max-width: 100%; height: auto; margin: 1.5em 0; }
.blog-content hr { margin: 2em 0; border: 0; border-top: 1px solid rgba(255,255,255,.2); }
.blog-content table { width: 100%; margin: 1.5em 0; border-collapse: collapse; font-size: .95em; }
.blog-content th, .blog-content td { border: 1px solid rgba(255,255,255,.2); padding: .5em .75em; text-align: left; vertical-align: top; }
.blog-content th { background: rgba(255,255,255,.06); font-weight: 600; }
.blog-content th > p, .blog-content td > p { margin: 0; }
.blog-content pre { margin: 1.5em 0; padding: 1em; overflow-x: auto; background: #111; border-radius: 6px; font-size: .9em; }
.blog-content code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: .9em; }
.blog-content :not(pre) > code { padding: .1em .35em; background: rgba(255,255,255,.08); border-radius: 4px; }
.blog-content mark { background: #f0ad3d; color: #050505; }
.blog-content iframe { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; margin: 1.5em 0; border: 0; }
`;
