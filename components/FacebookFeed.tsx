import React from 'react'

export default function FacebookFeed() {
  return (
    <div className="w-full flex justify-center">
      {/* Mobile (default) */}
      <iframe
        title="Facebook feed mobile"
        src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fsportovnirybolovsemin&tabs=timeline&width=350&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
        width="350"
        height="500"
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className="block md:hidden"
      />

      {/* Tablet & Desktop */}
      <iframe
        title="Facebook feed desktop"
        src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fsportovnirybolovsemin&tabs=timeline&width=350&height=750&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
        width="350"
        height="750"
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className="hidden md:block"
      />
    </div>
  )
} 