import { useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const useCamera = () => {
  const {
    isCameraActive,
    setIsCameraActive,
    availableCameras,
    setAvailableCameras,
    selectedCameraId,
    setSelectedCameraId,
    triggerAlert,
    streamRef,
    videoRef,
  } = useApp();

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    triggerAlert('Kamera packing berhasil dimatikan.', 'info');
  }, [setIsCameraActive, triggerAlert, streamRef, videoRef]);

  const startCameraStream = useCallback(async (deviceId?: string) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung (atau koneksi tidak aman/tidak HTTPS).');
      }

      // Stop current stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: 'environment' },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video play was interrupted or blocked by browser policy:', playErr);
        });
      }
      setIsCameraActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(videoInputs);

      if (mediaStream.getVideoTracks().length > 0) {
        const activeTrack = mediaStream.getVideoTracks()[0];
        const settings = activeTrack.getSettings();
        if (settings.deviceId) {
          setSelectedCameraId(settings.deviceId);
        }
      }
    } catch (err: any) {
      console.error('Failure starting camera stream:', err);
      triggerAlert(`Gagal menyalakan kamera: ${err.message || 'Izin ditolak'}`, 'error');
    }
  }, [setIsCameraActive, setAvailableCameras, setSelectedCameraId, triggerAlert, streamRef, videoRef]);

  const cycleCameraSources = useCallback(async () => {
    if (!isCameraActive || availableCameras.length <= 1) {
      triggerAlert('Hanya ada satu kamera yang terpasang atau kamera mati.', 'warning');
      return;
    }

    try {
      const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];

      if (nextCamera && nextCamera.deviceId) {
        await startCameraStream(nextCamera.deviceId);
        triggerAlert(`Kamera packing dialihkan: ${nextCamera.label || 'Kamera Baru'}`, 'success');
      }
    } catch (err: any) {
      console.warn('Error cycling camera sources:', err);
      triggerAlert(`Gagal beralih kamera: ${err.message || 'Error internal'}`, 'error');
    }
  }, [isCameraActive, availableCameras, selectedCameraId, startCameraStream, triggerAlert]);

  const forceCameraFacing = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { exact: facing },
        },
        audio: false,
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn(`Could not set exact facing mode '${facing}', fallback to ideal:`, err);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: facing },
          },
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video play was interrupted:', playErr);
        });
      }
      setIsCameraActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(videoInputs);

      if (mediaStream.getVideoTracks().length > 0) {
        const activeTrack = mediaStream.getVideoTracks()[0];
        const settings = activeTrack.getSettings();
        if (settings.deviceId) {
          setSelectedCameraId(settings.deviceId);
        }
      }

      triggerAlert(`Berhasil menghubungkan Kamera ${facing === 'environment' ? 'Belakang' : 'Depan'}!`, 'success');
    } catch (err: any) {
      console.warn('Force camera facing error:', err);
      triggerAlert(`Gagal menghubungkan Kamera ${facing === 'environment' ? 'Belakang' : 'Depan'}: ${err.message || 'Izin ditolak'}`, 'error');
    }
  }, [setIsCameraActive, setAvailableCameras, setSelectedCameraId, triggerAlert, streamRef, videoRef]);

  // Handle hotplugging
  useEffect(() => {
    const handleDeviceChange = async () => {
      if (isCameraActive && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((device) => device.kind === 'videoinput');
          setAvailableCameras(videoInputs);
        } catch (e) {
          console.warn('Gagal memperbarui daftar kamera saat perangkat berubah:', e);
        }
      }
    };

    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }
    return () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [isCameraActive, setAvailableCameras]);

  return {
    startCameraStream,
    stopCameraStream,
    cycleCameraSources,
    forceCameraFacing,
  };
};
