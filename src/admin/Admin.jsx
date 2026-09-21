import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Eye,
  FileText,
  Image,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
  Globe,
  MapPin,
  Film,
  Heart,
  PanelBottom,
  Trees,
  LayoutTemplate,
} from 'lucide-react';
import { api } from '../api';
import { Brand, PageRenderer } from '../public/PublicPage';
import { defaultSection, sectionDefaults, sectionLabels, sectionTypes } from '../../shared/content';

const labels = {
  title: 'Heading / title',
  description: 'Description',
  eyebrow: 'Small heading',
  image: 'Image',
  primaryLabel: 'Primary button label',
  primaryLink: 'Primary button link',
  secondaryLabel: 'Secondary button label',
  secondaryLink: 'Secondary button link',
  cardLabel: 'Image label',
  quote: 'Quotation',
  attribution: 'Supporting text',
  linkLabel: 'Link label',
  link: 'Link URL',
  videoUrl: 'YouTube video URL',
  videoPoster: 'Video cover image',
  category: 'Category',
  lat: 'Latitude',
  lng: 'Longitude',
  location: 'Location',
  address: 'Postal address',
  email: 'Contact email',
  phone: 'Phone number',
  copyright: 'Copyright text',
  icon: 'Icon',
  paragraphs: 'Paragraphs',
};
const navItems = [
  ['overview', 'Dashboard Overview', LayoutDashboard],
  ['pages', 'Page Management', FileText],
  ['hero', 'Hero Section', LayoutTemplate],
  ['nature', 'Nature Experience Cards', Trees],
  ['story', 'Content Section', FileText],
  ['destinations', 'Destination & Map', MapPin],
  ['media', 'Video & Image Gallery', Film],
  ['wellness', 'Wellness Experiences', Heart],
  ['footer', 'Footer Management', PanelBottom],
  ['library', 'Media Library', Image],
  ['settings', 'Admin Settings', Settings],
];
const reorder = (items, index, delta) => {
  const next = [...items];
  const to = index + delta;
  if (to >= 0 && to < next.length) [next[index], next[to]] = [next[to], next[index]];
  return next;
};
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="login-screen">
      <div className="login-photo">
        <Brand dark />
        <div>
          <p className="eyebrow light">A LITTLE CLOSER TO NATURE</p>
          <h1>
            A world of wonders.
            <br />
            Yours to share.
          </h1>
          <p>Welcome to the Bliss Nature Trails content studio.</p>
        </div>
      </div>
      <div className="login-area">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const data = await api('/admin/login', { method: 'POST', body: { email, password } });
              onLogin(data.user);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="admin-mark">
            <Leaf size={25} />
          </span>
          <p className="eyebrow">BLISS CONTENT STUDIO</p>
          <h2>Welcome back</h2>
          <p>Sign in to care for your corner of the island.</p>
          <label>
            Email address
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <button className="button teal" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowUpRight size={16} />
          </button>
          <p className="login-help">
            First time here? Create your administrator account using the setup instructions in
            README.md.
          </p>
          <Link className="text-link" to="/">
            ← Back to the website
          </Link>
        </form>
      </div>
    </div>
  );
}
function ImagePicker({ value, onChange, assets, onUpload }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="image-picker">
      <img src={value} alt="Selected image preview" />
      <div>
        <button type="button" className="small-button" onClick={() => setOpen(!open)}>
          <Image size={14} />
          Choose image
        </button>
        <span>{value}</span>
      </div>
      {open && (
        <div className="asset-chooser">
          <div className="row-between">
            <strong>Media library</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close image picker">
              <X size={17} />
            </button>
          </div>
          <UploadControl
            onUpload={async (file) => {
              const asset = await onUpload(file);
              if (asset) {
                onChange(asset.path);
                setOpen(false);
              }
            }}
          />
          <div className="asset-choices">
            {assets.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => {
                  onChange(a.path);
                  setOpen(false);
                }}
                title={a.original_name}
              >
                <img src={a.path} alt={a.original_name} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function UploadControl({ onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="upload-control">
      <label className="upload-label">
        <Upload size={17} /> Choose JPG, PNG or WebP · up to 8 MB
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
      </label>
      {file && (
        <div className="upload-preview">
          <img src={preview} alt="New upload preview" />
          <span>{file.name}</span>
          <button
            type="button"
            className="small-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await onUpload(file);
                if (result) setFile(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      )}
    </div>
  );
}
function Fields({ value, onChange, assets, onUpload }) {
  return (
    <div className="editor-fields">
      {Object.entries(value)
        .filter(([k]) => !['id', 'type', 'items'].includes(k))
        .map(([key, v]) => (
          <div
            key={key}
            className={
              ['description', 'paragraphs', 'quote', 'image', 'videoPoster'].includes(key)
                ? 'field full'
                : 'field'
            }
          >
            <label>{labels[key] || key}</label>
            {['image', 'videoPoster'].includes(key) ? (
              <ImagePicker
                value={v}
                onChange={(next) => onChange({ ...value, [key]: next })}
                assets={assets}
                onUpload={onUpload}
              />
            ) : key === 'paragraphs' ? (
              <div>
                {v.map((p, i) => (
                  <div className="paragraph-field" key={i}>
                    <textarea
                      aria-label={`Paragraph ${i + 1}`}
                      rows={4}
                      value={p}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          paragraphs: v.map((x, n) => (n === i ? e.target.value : x)),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove paragraph ${i + 1}`}
                      disabled={v.length === 1}
                      onClick={() =>
                        onChange({ ...value, paragraphs: v.filter((_, n) => n !== i) })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  className="small-button"
                  onClick={() => onChange({ ...value, paragraphs: [...v, ''] })}
                >
                  <Plus size={14} />
                  Add paragraph
                </button>
              </div>
            ) : ['description', 'quote', 'address'].includes(key) ? (
              <textarea
                aria-label={labels[key] || key}
                rows={3}
                value={v}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              />
            ) : key === 'icon' ? (
              <select
                aria-label="Icon"
                value={v}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              >
                {['leaf', 'trees', 'waves'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            ) : (
              <input
                aria-label={labels[key] || key}
                type={['lat', 'lng'].includes(key) ? 'number' : 'text'}
                step="any"
                value={v}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              />
            )}
          </div>
        ))}
    </div>
  );
}
function SectionEditor({ section, onChange, assets, onUpload }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="section-editor">
      <Fields value={section} onChange={onChange} assets={assets} onUpload={onUpload} />
      {section.items && (
        <div className="item-list">
          <div className="row-between">
            <h3>
              {section.type === 'destinations'
                ? 'Destinations'
                : section.type === 'media'
                  ? 'Gallery images'
                  : 'Content cards'}{' '}
              <span className="count">{section.items.length}</span>
            </h3>
            <button
              className="small-button"
              onClick={() => {
                const item = {
                  ...structuredClone(sectionDefaults[section.type].items[0]),
                  id: crypto.randomUUID(),
                  title: 'New item',
                };
                onChange({ ...section, items: [...section.items, item] });
                setExpanded(item.id);
              }}
            >
              <Plus size={15} />
              Add item
            </button>
          </div>
          {section.items.map((item, index) => (
            <article className="editor-item" key={item.id}>
              <div className="editor-item-header">
                {item.image && <img src={item.image} alt="" />}
                <button
                  className="item-toggle"
                  aria-expanded={expanded === item.id}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.category || item.description || 'Edit image and caption'}</span>
                </button>
                <button
                  aria-label={`Move ${item.title} up`}
                  disabled={index === 0}
                  onClick={() => onChange({ ...section, items: reorder(section.items, index, -1) })}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  aria-label={`Move ${item.title} down`}
                  disabled={index === section.items.length - 1}
                  onClick={() => onChange({ ...section, items: reorder(section.items, index, 1) })}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  aria-label={`Delete ${item.title}`}
                  onClick={() => {
                    if (confirm(`Remove ${item.title} from this draft?`))
                      onChange({
                        ...section,
                        items: section.items.filter((i) => i.id !== item.id),
                      });
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {expanded === item.id && (
                <div className="item-body">
                  <Fields
                    value={item}
                    onChange={(next) =>
                      onChange({
                        ...section,
                        items: section.items.map((i) => (i.id === item.id ? next : i)),
                      })
                    }
                    assets={assets}
                    onUpload={onUpload}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
export default function Admin() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [pages, setPages] = useState([]),
    [page, setPage] = useState(null),
    [saved, setSaved] = useState(null),
    [assets, setAssets] = useState([]),
    [tab, setTab] = useState('overview'),
    [notice, setNotice] = useState(null),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [mobile, setMobile] = useState(false),
    [newPage, setNewPage] = useState(false),
    [newTitle, setNewTitle] = useState(''),
    [newSlug, setNewSlug] = useState('');
  const dirty = JSON.stringify(page) !== JSON.stringify(saved);
  const notify = (message, error = false) => setNotice({ message, error });
  const run = async (fn) => {
    setBusy(true);
    try {
      return await fn();
    } catch (e) {
      notify(e.message, true);
      if (e.status === 401) setUser(null);
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    const [p, a] = await Promise.all([api('/admin/pages'), api('/admin/media')]);
    setPages(p);
    setAssets(a);
    return p;
  };
  const loadPage = async (id) => {
    const p = await api(`/admin/pages/${id}`);
    setPage(p);
    setSaved(structuredClone(p));
  };
  useEffect(() => {
    api('/admin/me')
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (user)
      run(async () => {
        const p = await refresh();
        if (p.length) await loadPage(p.find((x) => x.slug === 'home')?.id || p[0].id);
      });
  }, [user]);
  useEffect(() => {
    const listener = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);
  const changeSection = (id, next) =>
    setPage({ ...page, sections: page.sections.map((s) => (s.id === id ? next : s)) });
  const upload = async (file) => {
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Image exceeds the 8 MB limit.');
      const body = new FormData();
      body.append('image', file);
      const a = await api('/admin/media', { method: 'POST', body });
      setAssets((old) => [a, ...old]);
      notify('Image uploaded. Select it in a page section, then save.');
      return a;
    } catch (e) {
      notify(e.message, true);
      return null;
    }
  };
  const save = (publish) =>
    run(async () => {
      const p = await api(`/admin/pages/${page.id}${publish ? '?publish=true' : ''}`, {
        method: 'PUT',
        body: page,
      });
      setPage(p);
      setSaved(structuredClone(p));
      await refresh();
      notify(
        publish
          ? 'Published. Your changes are now live.'
          : 'Draft saved. The public website is unchanged.',
      );
    });
  if (loading) return <div className="loading">Opening the content studio…</div>;
  if (!user) return <Login onLogin={setUser} />;
  if (preview && page)
    return (
      <div className="admin-preview">
        <div className="preview-toolbar">
          <span>
            <Eye size={16} /> Previewing unsaved draft
          </span>
          <button className="small-button" onClick={() => setPreview(false)}>
            <X size={16} />
            Back to editor
          </button>
        </div>
        <PageRenderer page={page} preview />
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobile ? 'visible' : ''}`}>
        <Brand dark />
        <span className="studio-label">CONTENT STUDIO</span>
        <nav>
          {navItems.map(([key, label, Icon]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => {
                setTab(key);
                setMobile(false);
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" target="_blank">
            View website
            <ArrowUpRight size={16} />
          </Link>
          <button
            onClick={() => {
              if (!dirty || confirm('Discard unsaved changes and sign out?'))
                run(async () => {
                  await api('/admin/logout', { method: 'POST' });
                  setUser(null);
                  setPage(null);
                  setSaved(null);
                });
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <button
            className="admin-mobile-menu"
            aria-label="Toggle admin navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            Workspace{' '}
            <span className="breadcrumb">/ {navItems.find((i) => i[0] === tab)?.[1]}</span>
          </span>
          <span className="admin-user">
            <span>{user.email[0].toUpperCase()}</span>
            {user.email}
          </span>
        </header>
        <div className="admin-content">
          {notice && (
            <div
              role={notice.error ? 'alert' : 'status'}
              className={`notice ${notice.error ? 'error' : 'success'}`}
            >
              <span>{notice.message}</span>
              <button aria-label="Dismiss notification" onClick={() => setNotice(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="admin-title">
            <div>
              <p className="eyebrow">YOUR ISLAND, BEAUTIFULLY TOLD</p>
              <h1>{navItems.find((i) => i[0] === tab)?.[1]}</h1>
              <p>
                {tab === 'overview'
                  ? 'A little care. A world of difference.'
                  : 'Create, refine and share the stories that bring Sri Lanka to life.'}
              </p>
            </div>
            {page && !['overview', 'library', 'settings'].includes(tab) && (
              <div className="editor-actions">
                <button className="small-button" onClick={() => setPreview(true)}>
                  <Eye size={16} />
                  Preview
                </button>
                <button
                  className="small-button"
                  disabled={busy || !dirty}
                  onClick={() => {
                    setPage(structuredClone(saved));
                    notify('Unsaved changes discarded.');
                  }}
                >
                  Cancel
                </button>
                <button className="small-button" disabled={busy} onClick={() => save(false)}>
                  <Save size={16} />
                  Save draft
                </button>
                <button className="button teal" disabled={busy} onClick={() => save(true)}>
                  <Globe size={15} />
                  Publish
                </button>
              </div>
            )}
          </div>
          {tab === 'overview' && (
            <>
              <div className="stats-grid">
                {[
                  [pages.length, 'Tourism pages', FileText],
                  [pages.filter((p) => p.published_at).length, 'Published pages', Globe],
                  [assets.length, 'Images in your library', Image],
                ].map(([count, label, Icon]) => (
                  <div className="stat-card" key={label}>
                    <Icon size={23} />
                    <strong>{count}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="dashboard-welcome">
                <div>
                  <p className="eyebrow light">LET YOUR NEXT STORY BEGIN</p>
                  <h2>Keep the wonder growing.</h2>
                  <p>
                    Update a trail, share a new experience, or give your island story a fresh
                    perspective.
                  </p>
                  <button className="button white" onClick={() => setTab('pages')}>
                    Manage your pages
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
              <div className="admin-card">
                <h3>Your publishing workflow</h3>
                <div className="workflow">
                  <p>
                    <b>01 · Make it yours</b>Edit text, choose images and arrange sections.
                  </p>
                  <p>
                    <b>02 · Take a look</b>Preview your draft using the real website layout.
                  </p>
                  <p>
                    <b>03 · Share the wonder</b>Publish when you are ready for visitors to see it.
                  </p>
                </div>
              </div>
            </>
          )}
          {tab === 'pages' && (
            <>
              <div className="row-between page-list-heading">
                <h3>Your pages</h3>
                <button className="small-button" onClick={() => setNewPage(!newPage)}>
                  <Plus size={15} />
                  Create page
                </button>
              </div>
              {newPage && (
                <form
                  className="admin-card new-page-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (dirty && !confirm('Discard unsaved edits to create a page?')) return;
                    run(async () => {
                      const p = await api('/admin/pages', {
                        method: 'POST',
                        body: {
                          title: newTitle,
                          slug: newSlug,
                          sections: [
                            defaultSection('hero'),
                            defaultSection('story'),
                            defaultSection('footer'),
                          ],
                        },
                      });
                      setPage(p);
                      setSaved(structuredClone(p));
                      await refresh();
                      setNewPage(false);
                      setNewTitle('');
                      setNewSlug('');
                      notify('Page created as a draft. Customize its sections before publishing.');
                    });
                  }}
                >
                  <label>
                    Page title
                    <input
                      required
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        setNewSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, ''),
                        );
                      }}
                    />
                  </label>
                  <label>
                    URL slug
                    <input
                      required
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="your-new-experience"
                      pattern="[a-z0-9]+([/-][a-z0-9]+)*"
                    />
                  </label>
                  <button className="button teal" disabled={busy}>
                    Create draft
                  </button>
                </form>
              )}
              <div className="page-list">
                {pages.map((p) => (
                  <button
                    className={page?.id === p.id ? 'page-row active' : 'page-row'}
                    key={p.id}
                    onClick={() => {
                      if (!dirty || confirm('Discard unsaved edits and switch pages?'))
                        run(() => loadPage(p.id));
                    }}
                  >
                    <FileText size={20} />
                    <span>
                      <strong>{p.title}</strong>
                      <small>/{p.slug === 'home' ? '' : p.slug}</small>
                    </span>
                    <span className={`status-badge ${p.published_at ? 'published' : ''}`}>
                      {p.published_at ? 'Published' : 'Draft'}
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
            </>
          )}
          {page && !['overview', 'library', 'settings'].includes(tab) && (
            <>
              <div className="editing-page">
                <span>Editing</span>
                <select
                  aria-label="Select page to edit"
                  value={page.id}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!dirty || confirm('Discard unsaved edits and switch pages?'))
                      run(() => loadPage(id));
                  }}
                >
                  {pages.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <span className={`status-badge ${dirty ? 'unsaved' : ''}`}>
                  {dirty ? 'Unsaved changes' : 'Draft saved'}
                </span>
              </div>
              {tab === 'pages' ? (
                <div className="admin-card">
                  <div className="editor-fields">
                    <label>
                      Page title
                      <input
                        value={page.title}
                        onChange={(e) => setPage({ ...page, title: e.target.value })}
                      />
                    </label>
                    <label>
                      URL slug
                      <input
                        disabled={page.slug === 'home'}
                        value={page.slug}
                        onChange={(e) => setPage({ ...page, slug: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="row-between">
                    <h3>Page sections</h3>
                    <select
                      aria-label="Add a section"
                      value=""
                      onChange={(e) =>
                        setPage({
                          ...page,
                          sections: [...page.sections, defaultSection(e.target.value)],
                        })
                      }
                    >
                      <option value="" disabled>
                        Add a section…
                      </option>
                      {sectionTypes.map((t) => (
                        <option key={t} value={t}>
                          {sectionLabels[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {page.sections.map((s, index) => (
                    <div className="section-row" key={s.id}>
                      <span className="section-number">{String(index + 1).padStart(2, '0')}</span>
                      <button onClick={() => setTab(s.type)}>
                        {sectionLabels[s.type]}{' '}
                        <small>{s.title || `${s.items?.length || 0} items`}</small>
                      </button>
                      <button
                        aria-label="Move section up"
                        disabled={index === 0}
                        onClick={() =>
                          setPage({ ...page, sections: reorder(page.sections, index, -1) })
                        }
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        aria-label="Move section down"
                        disabled={index === page.sections.length - 1}
                        onClick={() =>
                          setPage({ ...page, sections: reorder(page.sections, index, 1) })
                        }
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        aria-label="Remove section"
                        disabled={page.sections.length === 1}
                        onClick={() => {
                          if (confirm('Remove this section from the draft?'))
                            setPage({
                              ...page,
                              sections: page.sections.filter((x) => x.id !== s.id),
                            });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {page.slug !== 'home' && (
                    <div className="danger-actions">
                      <button
                        className="small-button"
                        disabled={busy || !page.published_at}
                        onClick={() =>
                          run(async () => {
                            await api(`/admin/pages/${page.id}/unpublish`, { method: 'POST' });
                            await refresh();
                            setPage((p) => ({ ...p, published_at: null }));
                            setSaved((p) => ({ ...p, published_at: null }));
                            notify('Page unpublished. The draft remains available.');
                          })
                        }
                      >
                        Unpublish
                      </button>
                      <button
                        className="small-button danger"
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              'Permanently delete this page and both its draft and published content?',
                            )
                          )
                            run(async () => {
                              await api(`/admin/pages/${page.id}`, { method: 'DELETE' });
                              const p = await refresh();
                              await loadPage(p[0].id);
                              notify('Page deleted.');
                            });
                        }}
                      >
                        <Trash2 size={15} />
                        Delete page
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {page.sections
                    .filter((s) => s.type === tab)
                    .map((s) => (
                      <div className="admin-card" key={s.id}>
                        <h3>{sectionLabels[s.type]}</h3>
                        <SectionEditor
                          section={s}
                          onChange={(next) => changeSection(s.id, next)}
                          assets={assets}
                          onUpload={upload}
                        />
                      </div>
                    ))}
                  {!page.sections.some((s) => s.type === tab) && (
                    <div className="admin-card empty-state">
                      <Leaf />
                      <h3>This page has no {sectionLabels[tab]?.toLowerCase()} section yet.</h3>
                      <button
                        className="button teal"
                        onClick={() =>
                          setPage({ ...page, sections: [...page.sections, defaultSection(tab)] })
                        }
                      >
                        <Plus size={15} />
                        Add section
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {tab === 'library' && (
            <div className="admin-card">
              <h3>Your media library</h3>
              <p>
                Upload images, then choose them from any section editor. Original supplied assets
                are preserved.
              </p>
              <UploadControl onUpload={upload} />
              <div className="library-grid">
                {assets.map((a) => (
                  <article key={a.id}>
                    <img src={a.path} alt={a.original_name} />
                    <div>
                      <strong>{a.original_name}</strong>
                      <small>
                        {Math.round(a.size_bytes / 1024)} KB · {a.mime_type}
                      </small>
                      <button
                        className="small-button"
                        disabled={busy || a.path.startsWith('/images/')}
                        onClick={() => {
                          if (confirm('Delete this unused upload permanently?'))
                            run(async () => {
                              await api(`/admin/media/${a.id}`, { method: 'DELETE' });
                              await refresh();
                              notify('Image deleted.');
                            });
                        }}
                      >
                        <Trash2 size={13} />
                        {a.path.startsWith('/images/') ? 'Original asset' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <form
              className="admin-card settings-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                run(async () => {
                  if (data.get('newPassword') !== data.get('confirmPassword'))
                    throw new Error('The new passwords do not match.');
                  await api('/admin/password', {
                    method: 'PUT',
                    body: {
                      currentPassword: data.get('currentPassword'),
                      newPassword: data.get('newPassword'),
                    },
                  });
                  setUser(null);
                  setPage(null);
                  setSaved(null);
                });
              }}
            >
              <h3>Account security</h3>
              <p>Signed in as {user.email}. Changing your password signs out all sessions.</p>
              <label>
                Current password
                <input
                  name="currentPassword"
                  autoComplete="current-password"
                  type="password"
                  required
                />
              </label>
              <label>
                New password
                <input
                  name="newPassword"
                  autoComplete="new-password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  required
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="confirmPassword"
                  autoComplete="new-password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  required
                />
              </label>
              <button className="button teal" disabled={busy}>
                <Check size={16} />
                Update password & sign out
              </button>
            </form>
          )}
        </div>
        <footer className="admin-bottom">
          Bliss Nature Trails <Leaf size={12} /> A thoughtfully managed island story.
        </footer>
      </div>
    </div>
  );
}
