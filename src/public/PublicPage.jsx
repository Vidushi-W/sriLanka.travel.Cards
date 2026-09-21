import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Leaf,
  Menu,
  X,
  Trees,
  Waves,
  MapPin,
  Compass,
  Play,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  MoveUpRight,
  Download,
  Mountain,
  Globe,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { youtubeId } from '../../shared/content';

export function Brand({ dark = false }) {
  return (
    <Link className={`brand ${dark ? 'on-dark' : ''}`} to="/" aria-label="Sri Lanka tourism home">
      <span className="brand-script">
        Sri Lanka
        <Leaf size={16} />
      </span>
      <span className="brand-caption">a world of wonders</span>
    </Link>
  );
}
function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Brand dark />
        <button
          className="menu-toggle"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          {[
            ['Discover', '/#story'],
            ['Things to do', '/#experiences'],
            ['Nature & wildlife', '/#destinations'],
            ['Wellness', '/#experiences'],
            ['Plan your journey', '/#footer'],
          ].map(([label, link]) => (
            <a key={label} href={link} onClick={() => setOpen(false)}>
              {label}
              {label === 'Discover' && <ChevronDown size={11} />}
            </a>
          ))}
        </nav>
        <span className="nav-language">
          <Globe size={13} /> EN
        </span>
      </div>
    </header>
  );
}
function Hero({ section: s }) {
  return (
    <section className="hero" style={{ backgroundImage: `url("${s.image}")` }}>
      <div className="hero-shade" />
      <div className="hero-copy">
        <p className="eyebrow light">
          <span />
          {s.eyebrow}
          <span />
        </p>
        <h1>{s.title}</h1>
        <p className="hero-description">{s.description}</p>
        <div className="hero-actions">
          <a className="button cyan" href={s.primaryLink}>
            {s.primaryLabel}
            <ArrowUpRight size={15} />
          </a>
          <a className="button glass" href={s.secondaryLink}>
            {s.secondaryLabel}
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
      <div className="hero-note">
        <Leaf size={26} />
        <span>
          A little wild.
          <br />A little wonderful.
        </span>
      </div>
      <a className="scroll-note" href="#story">
        BREATHE. WANDER. BELONG.
        <ChevronDown size={16} />
      </a>
    </section>
  );
}
function Nature({ section: s }) {
  const icons = { trees: Trees, waves: Waves, leaf: Leaf };
  return (
    <section className="nature-wrap container">
      <div className="nature-grid">
        {s.items.map((item) => {
          const Icon = icons[item.icon] || Leaf;
          return (
            <a href={item.link} className="nature-card" key={item.id}>
              <img src={item.image} alt="" />
              <div className="card-shade" />
              <div className="nature-copy">
                <Icon size={23} strokeWidth={1.4} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="round-arrow">
                <ArrowUpRight size={18} />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
function Story({ section: s }) {
  return (
    <section id="story" className="story container">
      <div className="story-copy">
        <p className="eyebrow">{s.eyebrow}</p>
        <h2>{s.title}</h2>
        {s.paragraphs.map((p, i) => (
          <p className="body-copy" key={i}>
            {p}
          </p>
        ))}
        <div className="story-links">
            <a href="/#destinations">
            <Compass size={16} /> Walk a little further <ArrowUpRight size={13} />
          </a>
          <a href={s.link}>
            <Leaf size={16} />
            {s.linkLabel}
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <aside className="quote-card">
        <div className="quote-image">
          <img src={s.image} alt="Restorative wellness in a tropical sanctuary" loading="lazy" />
          <span>{s.cardLabel}</span>
        </div>
        <blockquote>“{s.quote}”</blockquote>
        <a href={s.link}>
          {s.attribution}
          <ArrowUpRight size={17} />
        </a>
        <Leaf className="quote-leaf" size={100} strokeWidth={0.6} />
      </aside>
    </section>
  );
}
function MapFocus({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], 9, { duration: 1 });
  }, [selected, map]);
  return null;
}
function Destinations({ section: s }) {
  const [category, setCategory] = useState('All places');
  const [selected, setSelected] = useState(null);
  const categories = ['All places', ...new Set(s.items.map((i) => i.category))];
  const shown = s.items.filter((i) => category === 'All places' || i.category === category);
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            type: 'FeatureCollection',
            features: s.items.map((i) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
              properties: {
                name: i.title,
                description: i.description,
                category: i.category,
                location: i.location,
              },
            })),
          },
          null,
          2,
        ),
      ],
      { type: 'application/geo+json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sri-lanka-nature-trails.geojson';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section id="destinations" className="destinations container">
      <div className="section-heading">
        <div className="section-symbol">
          <Leaf size={17} />
        </div>
        <h2>{s.title}</h2>
        <p>{s.description}</p>
      </div>
      <div className="destination-layout">
        <div className="map-column">
          <div className="filters" aria-label="Destination categories">
            {categories.map((c) => (
              <button
                key={c}
                aria-pressed={category === c}
                className={category === c ? 'active' : ''}
                onClick={() => {
                  setCategory(c);
                  setSelected(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="map-frame">
            <div className="map-label">
              <Leaf size={12} /> SRI LANKA · FIND YOUR NATURAL RHYTHM
            </div>
            <MapContainer
              center={[7.65, 80.65]}
              zoom={7}
              scrollWheelZoom={false}
              className="trail-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {shown.map((d) => (
                <CircleMarker
                  key={d.id}
                  center={[d.lat, d.lng]}
                  radius={selected?.id === d.id ? 11 : 7}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: '#087c79', fillOpacity: 1 }}
                  eventHandlers={{ click: () => setSelected(d) }}
                >
                  <Popup>
                    <strong>{d.title}</strong>
                    <p>{d.description}</p>
                    <small>{d.location}</small>
                    <p>
                      {d.lat.toFixed(3)}° N, {d.lng.toFixed(3)}° E
                    </p>
                  </Popup>
                </CircleMarker>
              ))}
              <MapFocus selected={selected} />
            </MapContainer>
            <div className="map-caption">
              <Compass size={16} />
              <span>Slow moments. Meaningful journeys. Naturally Sri Lanka.</span>
            </div>
          </div>
          {selected && (
            <div className="selected-destination" role="status">
              <img src={selected.image} alt={selected.title} />
              <div>
                <span className="eyebrow">{selected.category}</span>
                <h3>{selected.title}</h3>
                <p>{selected.description}</p>
                <small>
                  <MapPin size={12} />
                  {selected.location} · {selected.lat}° N, {selected.lng}° E
                </small>
              </div>
              <button aria-label="Close destination details" onClick={() => setSelected(null)}>
                <X size={17} />
              </button>
            </div>
          )}
        </div>
        <aside className="destination-panel">
          <div className="destination-panel-heading">
            <h3>
              <MapPin size={20} /> Your next
              <br />
              discovery
            </h3>
            <span>
              {shown.length} beautiful
              <br />
              places
            </span>
          </div>
          <div className="destination-list">
            {shown.map((d) => (
              <button
                className={selected?.id === d.id ? 'destination-item selected' : 'destination-item'}
                key={d.id}
                onClick={() => setSelected(d)}
              >
                <div>
                  <h4>{d.title}</h4>
                  <p>{d.location}</p>
                </div>
                <span>
                  {d.category}
                  <ArrowUpRight size={12} />
                </span>
              </button>
            ))}
          </div>
          <button className="download-button" onClick={download}>
            <Download size={15} /> Download destination map
          </button>
        </aside>
      </div>
    </section>
  );
}
function Modal({ children, onClose, label }) {
  const ref = useRef();
  useEffect(() => {
    const last = document.activeElement;
    ref.current?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
      last?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="media-modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Tab') {
            const nodes = ref.current.querySelectorAll('button,a,input,iframe');
            if (nodes.length) {
              if (e.shiftKey && document.activeElement === nodes[0]) {
                e.preventDefault();
                nodes[nodes.length - 1].focus();
              } else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
                e.preventDefault();
                nodes[0].focus();
              }
            }
          }
        }}
      >
        <button className="modal-close" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
function Media({ section: s }) {
  const [playing, setPlaying] = useState(false);
  const [photo, setPhoto] = useState(null);
  const id = youtubeId(s.videoUrl);
  return (
    <section className="media-section container" id="island-life">
      <div className="video-card">
        {playing && id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={s.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            className="video-cover"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${s.title}`}
          >
            <img src={s.videoPoster} alt="Sri Lankan food and island traditions" loading="lazy" />
            <div className="video-top">
              <span className="video-avatar">SL</span>
              <span>
                {s.title}
                <small>Sri Lanka · A world of wonders</small>
              </span>
            </div>
            <span className="play-button">
              <Play size={29} fill="currentColor" />
            </span>
            <span className="video-bottom">
              A little taste of paradise <ArrowUpRight size={17} />
            </span>
          </button>
        )}
      </div>
      <div className="gallery-grid">
        {s.items.map((i) => (
          <button key={i.id} onClick={() => setPhoto(i)} aria-label={`View ${i.title}`}>
            <img src={i.image} alt={i.title} loading="lazy" />
            <span>{i.title}</span>
          </button>
        ))}
      </div>
      {photo && (
        <Modal onClose={() => setPhoto(null)} label={photo.title}>
          <img className="lightbox-photo" src={photo.image} alt={photo.title} />
          <p>{photo.title}</p>
        </Modal>
      )}
    </section>
  );
}
function Wellness({ section: s }) {
  return (
    <section id="experiences" className="wellness">
      <div className="container">
        <div className="wellness-heading">
          <span />
          <Leaf size={18} />
          <div>
            <h2>{s.title}</h2>
            <p>{s.description}</p>
          </div>
          <Leaf size={18} />
          <span />
        </div>
        <div className="wellness-grid">
          {s.items.map((i) => (
            <a href={i.link} className="wellness-card" key={i.id}>
              <img src={i.image} alt="" loading="lazy" />
              <div className="card-shade" />
              <div>
                <h3>{i.title}</h3>
                <p>{i.description}</p>
              </div>
              <MoveUpRight size={15} />
            </a>
          ))}
        </div>
        <div className="wellness-signoff">
          <Leaf size={33} strokeWidth={1} />
          <p>
            Take a breath.
            <br />
            <span>You're in Sri Lanka.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
function Footer({ section: s }) {
  const groups = [...new Set(s.items.map((i) => i.description))];
  return (
    <footer className="site-footer" id="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand dark />
            <p>{s.description}</p>
            <div className="socials">
              {s.items
                .filter((i) => i.description === 'Follow us')
                .map((i) => {
                  const Icon =
                    i.title === 'Instagram'
                      ? Instagram
                      : i.title === 'Facebook'
                        ? Facebook
                        : Youtube;
                  return (
                    <a key={i.id} href={i.link} aria-label={i.title}>
                      <Icon size={16} />
                    </a>
                  );
                })}
            </div>
          </div>
          <div className="footer-callout">
            <span>
              TOURISM HOTLINE<strong>1912</strong>
            </span>
            <span>
              FIND YOUR NEXT
              <strong>
                Island escape <ArrowUpRight size={17} />
              </strong>
            </span>
          </div>
        </div>
        <div className="footer-links">
          {groups
            .filter((g) => g !== 'Follow us')
            .map((g) => (
              <div key={g}>
                <h4>{g}</h4>
                {s.items
                  .filter((i) => i.description === g)
                  .map((i) => (
                    <a key={i.id} href={i.link.startsWith('#') ? `/${i.link}` : i.link}>
                      {i.title}
                    </a>
                  ))}
              </div>
            ))}
          <div className="footer-contact">
            <h4>Get in touch</h4>
            <p>{s.address}</p>
            <a href={`mailto:${s.email}`}>
              <Mail size={13} />
              {s.email}
            </a>
            <a href={`tel:${s.phone.replace(/\s/g, '')}`}>
              <Phone size={13} />
              {s.phone}
            </a>
          </div>
          <div>
            <h4>{s.title}</h4>
            <p>
              Let the journey
              <br />
              change your rhythm.
            </p>
            <a className="footer-explore" href="/#destinations">
              Explore the island <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.copyright}
          </span>
          <span>Made for a little more wonder.</span>
          <Link to="/admin">
            Administration <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
export function PageRenderer({ page, preview = false }) {
  const components = {
    hero: Hero,
    nature: Nature,
    story: Story,
    destinations: Destinations,
    media: Media,
    wellness: Wellness,
    footer: Footer,
  };
  return (
    <>
      {preview && (
        <div className="preview-banner">Draft preview · Your changes are not yet public</div>
      )}
      <Navigation />
      <main>
        {page.sections.map((s) => {
          const Component = components[s.type];
          return Component ? <Component section={s} key={s.id} /> : null;
        })}
      </main>
    </>
  );
}
export function PublicPage() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setData(null);
    api(`/page?slug=${encodeURIComponent(location.pathname.slice(1) || 'home')}`, {
      signal: controller.signal,
    })
      .then((d) => {
        setData(d);
        document.title = `${d.page.title} · Sri Lanka`;
        if (location.hash)
          setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 150);
        else window.scrollTo(0, 0);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [location.pathname]);
  if (error)
    return (
      <div className="empty-page">
        <Brand />
        <h1>{error}</h1>
        <Link className="button teal" to="/">
          Return to the island <ArrowRight size={16} />
        </Link>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <Leaf />
        Finding your natural rhythm…
      </div>
    );
  return <PageRenderer page={data.page} />;
}
