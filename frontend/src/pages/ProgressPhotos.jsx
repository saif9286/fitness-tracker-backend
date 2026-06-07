import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import { Camera, Trash2, Plus, Calendar, Image as ImageIcon, Sliders, Upload, RefreshCw, ZapOff } from 'lucide-react';

export default function ProgressPhotos() {
  const toast = useToast();
  
  // Data states
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [angleFilter, setAngleFilter] = useState('all');

  // Before & After comparison states
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Upload Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [angle, setAngle] = useState('front');
  const [notes, setNotes] = useState('');
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);

  // Camera states
  const [uploadTab, setUploadTab] = useState('file'); // 'file' | 'camera'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null); // base64 data URL
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/photos');
      if (res.success) {
        setPhotos(res.data);
      }
    } catch (err) {
      toast.error('Failed to load progress photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // --- Camera helpers ---
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser.'
          : 'Could not access camera. Make sure a webcam is connected.'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPreview(dataUrl);
    stopCamera();
    // Convert data URL to File
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  const handleRetake = useCallback(() => {
    setCapturedPreview(null);
    setSelectedFile(null);
    startCamera();
  }, [startCamera]);

  // Start / stop camera when tab changes or modal closes
  useEffect(() => {
    if (uploadModalOpen && uploadTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
      if (!uploadModalOpen) setCapturedPreview(null);
    }
    return () => stopCamera();
  }, [uploadModalOpen, uploadTab, startCamera, stopCamera]);

  const handleModalClose = () => {
    stopCamera();
    setCapturedPreview(null);
    setSelectedFile(null);
    setNotes('');
    setAngle('front');
    setUploadTab('file');
    setUploadModalOpen(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      return toast.warning('Please select an image file first');
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('angle', angle);
    formData.append('notes', notes);
    formData.append('date', photoDate);

    setUploading(true);
    try {
      const { data: res } = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.success) {
        toast.success('Progress photo logged successfully');
        stopCamera();
        setCapturedPreview(null);
        setUploadTab('file');
        setUploadModalOpen(false);
        setSelectedFile(null);
        setNotes('');
        setAngle('front');
        fetchPhotos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this progress photo?')) return;
    
    try {
      const { data: res } = await api.delete(`/photos/${id}`);
      if (res.success) {
        toast.success('Photo removed');
        // Clear comparison selections if deleted
        if (beforePhoto?.id === id) setBeforePhoto(null);
        if (afterPhoto?.id === id) setAfterPhoto(null);
        fetchPhotos();
      }
    } catch (err) {
      toast.error('Failed to delete photo');
    }
  };

  const handleSelectCompare = (photo, role) => {
    if (role === 'before') {
      setBeforePhoto(photo);
    } else {
      setAfterPhoto(photo);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (angleFilter === 'all') return true;
    return p.angle === angleFilter;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>Progress Photos Gallery</h1>
          <p>Document your physical transformations and log muscle development timelines.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => setComparing(!comparing)} size="sm">
            <Sliders size={16} /> {comparing ? 'Close Comparison' : 'Compare Before/After'}
          </Button>
          <Button variant="primary" onClick={() => setUploadModalOpen(true)} size="sm">
            <Plus size={16} /> Log Photo
          </Button>
        </div>
      </div>

      {/* Before / After Comparison Workspace */}
      {comparing && (
        <Card style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-elevated)', border: '1px solid var(--accent-blue-bg)' }}>
          <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--accent-blue)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Sliders size={18} /> Transformation Workspace
          </h3>
          <p className="text-secondary text-small" style={{ marginBottom: 'var(--space-4)' }}>
            Select a "Before" and "After" photo from the gallery cards below to inspect side-by-side modifications.
          </p>

          <div className="form-grid-two-columns" style={{ gap: 'var(--space-6)' }}>
            {/* Before block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', minHeight: '300px', background: 'var(--bg-surface)' }}>
              {beforePhoto ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <img src={beforePhoto.image_url} alt="Before" style={{ maxHeight: '280px', objectFit: 'contain', borderRadius: 'var(--radius-md)', margin: '0 auto var(--space-3) auto' }} />
                  <div className="text-mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    BEFORE: {new Date(beforePhoto.date).toLocaleDateString()} ({beforePhoto.angle})
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setBeforePhoto(null)} style={{ marginTop: '8px', color: 'var(--accent-red)' }}>Change</Button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <ImageIcon size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <div>Select "Before" photo below</div>
                </div>
              )}
            </div>

            {/* After block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', minHeight: '300px', background: 'var(--bg-surface)' }}>
              {afterPhoto ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <img src={afterPhoto.image_url} alt="After" style={{ maxHeight: '280px', objectFit: 'contain', borderRadius: 'var(--radius-md)', margin: '0 auto var(--space-3) auto' }} />
                  <div className="text-mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    AFTER: {new Date(afterPhoto.date).toLocaleDateString()} ({afterPhoto.angle})
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAfterPhoto(null)} style={{ marginTop: '8px', color: 'var(--accent-red)' }}>Change</Button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <ImageIcon size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <div>Select "After" photo below</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'All Angles' },
          { id: 'front', label: 'Front View' },
          { id: 'side', label: 'Side Profile' },
          { id: 'back', label: 'Back View' },
        ].map((ang) => (
          <button
            key={ang.id}
            onClick={() => setAngleFilter(ang.id)}
            className={`btn btn-sm ${angleFilter === ang.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
          >
            {ang.label}
          </button>
        ))}
      </div>

      {/* Gallery view */}
      {loading && photos.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
      ) : filteredPhotos.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)', borderStyle: 'dashed' }}>
          <Camera size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)', opacity: 0.5 }} />
          <h4 style={{ fontWeight: 'var(--weight-semibold)', marginBottom: '4px' }}>No progress photos found</h4>
          <p className="text-secondary text-small" style={{ marginBottom: 'var(--space-4)' }}>
            Start capturing and uploading progress snapshots to inspect visual shifts.
          </p>
          <Button variant="primary" onClick={() => setUploadModalOpen(true)}>Log Your First Photo</Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Photo Area */}
              <div style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--bg-surface)' }}>
                <img
                  src={photo.image_url}
                  alt={`Progress ${photo.angle}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Overlay Badge for angle */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'var(--text-primary)',
                  fontSize: '10px',
                  fontWeight: 'var(--weight-semibold)',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.05em'
                }}>
                  {photo.angle}
                </div>

                {/* Delete button overlay */}
                <button
                  onClick={() => handleDelete(photo.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 71, 87, 0.85)',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-red)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.85)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Text Area */}
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', justifyBlock: 'space-between', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <Calendar size={12} />
                    {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {photo.notes && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px', lineHeight: '20px' }}>
                      {photo.notes}
                    </p>
                  )}
                </div>

                {/* Workspace actions */}
                {comparing && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                    <Button variant="secondary" size="sm" onClick={() => handleSelectCompare(photo, 'before')} style={{ flex: 1, padding: '4px 0', fontSize: '11px' }}>
                      Set Before
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleSelectCompare(photo, 'after')} style={{ flex: 1, padding: '4px 0', fontSize: '11px' }}>
                      Set After
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Photo Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={handleModalClose}
        title="Log Progress Snapshot"
      >
        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: 'var(--space-5)',
          border: '1px solid var(--border-primary)',
        }}>
          {[{ id: 'file', icon: <Upload size={14} />, label: 'Upload File' }, { id: 'camera', icon: <Camera size={14} />, label: 'Take Photo' }].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setUploadTab(tab.id); setSelectedFile(null); setCapturedPreview(null); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'var(--weight-medium)',
                fontSize: 'var(--text-sm)',
                transition: 'all 0.2s ease',
                background: uploadTab === tab.id ? 'var(--accent-blue)' : 'transparent',
                color: uploadTab === tab.id ? '#fff' : 'var(--text-secondary)',
                boxShadow: uploadTab === tab.id ? '0 2px 8px rgba(0,122,255,0.35)' : 'none',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleUpload}>
          {/* ---- FILE UPLOAD TAB ---- */}
          {uploadTab === 'file' && (
            <div className="form-group">
              <label className="form-label">Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                }}
              />
              {selectedFile && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}

          {/* ---- CAMERA TAB ---- */}
          {uploadTab === 'camera' && (
            <div className="form-group">
              <label className="form-label">Camera Preview</label>

              {cameraError ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: 'var(--space-6)',
                  border: '1px dashed var(--accent-red)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,71,87,0.06)',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                }}>
                  <ZapOff size={32} style={{ color: 'var(--accent-red)', opacity: 0.7 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>{cameraError}</p>
                  <Button variant="secondary" size="sm" type="button" onClick={startCamera}>
                    <RefreshCw size={14} /> Retry
                  </Button>
                </div>
              ) : capturedPreview ? (
                /* Captured preview */
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img
                    src={capturedPreview}
                    alt="Captured"
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}>
                    <Button variant="secondary" size="sm" type="button" onClick={handleRetake}
                      style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none' }}>
                      <RefreshCw size={14} /> Retake
                    </Button>
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(52,199,89,0.85)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.04em',
                  }}>✓ Photo Captured</div>
                </div>
              ) : (
                /* Live camera feed */
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
                  />
                  {!cameraActive && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.6)',
                    }}>
                      <Spinner size="lg" />
                    </div>
                  )}
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      title="Capture Photo"
                      style={{
                        position: 'absolute',
                        bottom: '14px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '4px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease',
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(0.93)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                    >
                      <Camera size={22} style={{ color: '#111' }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Pose / Angle</label>
            <select
              className="form-input"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              style={{ appearance: 'none', background: 'var(--bg-surface) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a0a0a0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 16px center', backgroundSize: '16px' }}
            >
              <option value="front">Front Shot</option>
              <option value="side">Side Profile</option>
              <option value="back">Back Shot</option>
            </select>
          </div>

          <Input
            label="Log Date"
            type="date"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
            required
          />

          <div className="form-group">
            <label className="form-label">Progress Notes</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weight: 74kg. Fasted state. Biceps look fuller."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" onClick={handleModalClose} disabled={uploading} type="button">Cancel</Button>
            <Button variant="accent" type="submit" loading={uploading}
              disabled={!selectedFile && !(capturedPreview)}
            >Log Photo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
