'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { GripVertical, Plus, Trash2, Image as ImageIcon, Save, Smartphone } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { normalizeMediaUrl } from '@/lib/media';

type BlockType = 'banner_carousel' | 'learning_cards' | 'quick_access' | 'custom_image' | 'spacer';

interface LayoutBlock {
  id: string;
  type: BlockType;
  title?: string;
  imageUrl?: string;
  actionUrl?: string;
  height?: number;
}

interface HomeLayout {
  globalBackgroundUrl?: string;
  globalBackgroundColor?: string;
  blocks: LayoutBlock[];
}

export default function HomeBuilderPage() {
  const [layout, setLayout] = useState<HomeLayout>({ blocks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [liveBanners, setLiveBanners] = useState<any[]>([]);
  const [liveSubjects, setLiveSubjects] = useState<any[]>([]);

  

  useEffect(() => {
    fetchLayout();
  }, []);

  async function fetchLayout() {
    try {
      const docRef = doc(db, 'app_config', 'home_layout');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLayout(docSnap.data() as HomeLayout);
      } else {
        // Default layout
        setLayout({
          blocks: [
            { id: '1', type: 'banner_carousel' },
            { id: '2', type: 'learning_cards', title: 'Start Learning' },
            { id: '3', type: 'quick_access', title: 'Quick Access' }
          ]
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load layout');
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'app_config', 'home_layout'), layout);
      toast.success('Layout saved successfully! The app will update instantly.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: BlockType) => {
    setLayout(prev => ({
      ...prev,
      blocks: [...prev.blocks, { id: Date.now().toString(), type }]
    }));
  };

  const removeBlock = (id: string) => {
    setLayout(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
  };

  const updateBlock = (id: string, updates: Partial<LayoutBlock>) => {
    setLayout(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? { ...b, ...updates } : b))
    }));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === layout.blocks.length - 1)
    ) return;

    const newBlocks = [...layout.blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    setLayout(prev => ({ ...prev, blocks: newBlocks }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dynamic Home Builder</h1>
          <button
            onClick={saveLayout}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Publish Layout'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Global Settings</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Global Background Image (Optional)</label>
            <ImageUpload
              value={layout.globalBackgroundUrl || ''}
              onChange={(url) => setLayout(prev => ({ ...prev, globalBackgroundUrl: url }))}
              storagePath="home_assets"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Global Background Color (Hex)</label>
            <input
              type="text"
              value={layout.globalBackgroundColor || ''}
              onChange={(e) => setLayout(prev => ({ ...prev, globalBackgroundColor: e.target.value }))}
              placeholder="#F7F8FC"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Layout Blocks</h2>
          {layout.blocks.map((block, index) => (
            <div key={block.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="hover:text-gray-700 disabled:opacity-30">▲</button>
                <GripVertical size={20} />
                <button onClick={() => moveBlock(index, 'down')} disabled={index === layout.blocks.length - 1} className="hover:text-gray-700 disabled:opacity-30">▼</button>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium bg-gray-100 px-2 py-1 rounded text-sm uppercase tracking-wider">{block.type.replace('_', ' ')}</span>
                  <button onClick={() => removeBlock(block.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={18} />
                  </button>
                </div>

                {(block.type === 'learning_cards' || block.type === 'quick_access') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="e.g. My Learning"
                    />
                  </div>
                )}

                {block.type === 'custom_image' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Image / GIF Upload</label>
                      <ImageUpload
                        value={block.imageUrl || ''}
                        onChange={(url) => updateBlock(block.id, { imageUrl: url })}
                        storagePath="home_assets"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Action URL (Route Name or Web URL)</label>
                      <input
                        type="text"
                        value={block.actionUrl || ''}
                        onChange={(e) => updateBlock(block.id, { actionUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="e.g. /courses or https://..."
                      />
                    </div>
                  </div>
                )}

                {block.type === 'spacer' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Height (pixels)</label>
                    <input
                      type="number"
                      value={block.height || 20}
                      onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <button onClick={() => addBlock('banner_carousel')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1"><Plus size={16}/> Banner Carousel</button>
            <button onClick={() => addBlock('learning_cards')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1"><Plus size={16}/> Learning Grid</button>
            <button onClick={() => addBlock('quick_access')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1"><Plus size={16}/> Quick Access</button>
            <button onClick={() => addBlock('custom_image')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1"><ImageIcon size={16}/> Custom Image / GIF</button>
            <button onClick={() => addBlock('spacer')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1"><Plus size={16}/> Spacer</button>
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 border-l pl-6 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Smartphone size={20}/> App Preview</h2>
        
        <div 
          className="w-[300px] h-[600px] bg-[#F7F8FC] border-[8px] border-gray-900 rounded-[3rem] overflow-hidden shadow-xl relative"
          style={{
            backgroundColor: layout.globalBackgroundColor || '#F7F8FC',
            backgroundImage: layout.globalBackgroundUrl ? `url(${layout.globalBackgroundUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Mock Header */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
          </div>

          <div className="px-4 space-y-4 pb-10 overflow-y-auto h-[calc(100%-4rem)] custom-scrollbar">
            {layout.blocks.map(block => (
              <div key={block.id}>
                {block.type === 'banner_carousel' && (
                  <div className="w-full h-32 rounded-xl flex items-center justify-center relative overflow-hidden bg-gray-100">
                    {liveBanners.length > 0 ? (
                      <img src={normalizeMediaUrl(liveBanners[0].imageUrl)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center"><ImageIcon size={24}/><span className="text-xs mt-1">Banners</span></div>
                    )}
                  </div>
                )}
                {block.type === 'learning_cards' && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">{block.title || 'Learning'}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {liveSubjects.length > 0 ? liveSubjects.map(sub => (
                        <div key={sub.id} className="h-24 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                          {sub.imageUrl ? <img src={normalizeMediaUrl(sub.imageUrl)} className="w-8 h-8 object-contain mb-1" /> : <div className="w-8 h-8 bg-blue-50 rounded-full mb-1"></div>}
                          <span className="text-[10px] font-medium text-gray-700 line-clamp-2">{sub.name || 'Subject'}</span>
                        </div>
                      )) : [1,2,3,4].map(i => (
                        <div key={i} className="h-24 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-xs text-gray-400">Card</div>
                      ))}
                    </div>
                  </div>
                )}
                {block.type === 'quick_access' && (
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">{block.title || 'Quick Access'}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: '📝', label: 'Tests' },
                        { icon: '📊', label: 'Results' },
                        { icon: '🎥', label: 'Live' },
                        { icon: '📚', label: 'Notes' },
                      ].map((item, i) => (
                        <div key={i} className="aspect-square bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-[9px] text-gray-600 font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {block.type === 'custom_image' && (
                  <div className="w-full overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center relative min-h-[100px]">
                    {block.imageUrl ? (
                      <img src={normalizeMediaUrl(block.imageUrl)} alt="Custom" className="w-full h-auto object-cover" />
                    ) : (
                      <div className="py-8 flex flex-col items-center text-gray-400">
                        <ImageIcon size={24} className="mb-1" />
                        <span className="text-xs">No Image Added</span>
                      </div>
                    )}
                  </div>
                )}
                {block.type === 'spacer' && (
                  <div style={{ height: `${block.height || 20}px` }} className="w-full border border-dashed border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
                    Spacer {block.height || 20}px
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
