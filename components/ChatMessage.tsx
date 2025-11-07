import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';


export const UserMessage: React.FC<{ text: string; image?: string }> = ({ text, image }) => (
    <div className="flex justify-end">
        <div className="bg-cyan-600 rounded-lg p-3 max-w-lg">
            {image && <img src={image} alt="User upload" className="rounded-md mb-2 max-w-full h-auto" style={{maxWidth: '320px'}} />}
            {text && <p>{text}</p>}
        </div>
    </div>
);

// Custom component to render the <pre> tag with a copy button
const PreWithCopy: React.FC<React.ComponentPropsWithoutRef<'pre'>> = ({ children }) => {
    const [copied, setCopied] = useState(false);

    // ReactMarkdown passes a `code` element as the single child
    const codeElement = React.Children.only(children) as React.ReactElement<HTMLElement>;
    const codeString = codeElement.props.children ? String(codeElement.props.children).replace(/\n$/, '') : '';
    const language = codeElement.props.className?.replace('language-', '') || 'text';

    const handleCopy = () => {
        if (codeString) {
            navigator.clipboard.writeText(codeString).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Revert back after 2 seconds
            }, (err) => {
                console.error('Failed to copy text: ', err);
            });
        }
    };
    
    return (
        <div className="relative group bg-slate-800/80 rounded-lg my-4">
             <div className="flex items-center justify-between bg-slate-900/80 text-slate-300 text-xs px-3 py-1.5 rounded-t-lg border-b border-slate-700">
                <span>{language}</span>
                <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors"
                    aria-label="Copy code to clipboard"
                >
                    {copied ? (
                        <>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                            Copied
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            {/* The actual <pre> tag that ReactMarkdown wants */}
            <pre className="p-4 overflow-x-auto text-sm">{children}</pre>
        </div>
    );
};

export const ModelMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex justify-start">
        <div className="bg-slate-700 rounded-lg p-3 max-w-lg prose prose-invert prose-sm max-w-full prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-headings:my-4 prose-blockquote:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0 prose-pre:rounded-none">
            {typeof children === 'string' ? (
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        pre: PreWithCopy,
                    }}
                >
                    {children}
                </ReactMarkdown>
            ) : (
                children
            )}
        </div>
    </div>
);