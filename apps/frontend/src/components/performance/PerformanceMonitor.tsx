'use client';

import { useEffect, useRef } from 'react';
import { monitoringService, MetricType } from '@/services/monitoring.service';

interface PerformanceMonitorProps {
  id: string;
  metricType?: MetricType;
}

/**
 * Component that monitors and reports performance metrics
 */
export function PerformanceMonitor({ id, metricType = MetricType.RENDER_TIME }: PerformanceMonitorProps) {
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    // Record component mount time
    const mountDuration = Date.now() - startTimeRef.current;
    
    // Report mount duration
    monitoringService.trackPerformance({
      type: metricType,
      name: `${id}_mount`,
      value: mountDuration,
    });
    
    // Set up performance observer for layout shifts
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Layout Shifts observer
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Only track layout shifts for this component
            if (entry.sources && entry.sources.some(source => {
              const node = source.node as HTMLElement;
              return node && node.closest(`[data-performance-id="${id}"]`);
            })) {
              monitoringService.trackPerformance({
                type: MetricType.USER_INTERACTION,
                name: `${id}_layout_shift`,
                value: (entry as any).value * 100, // Convert to percentage
              });
            }
          }
        });
        layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
        
        return () => {
          layoutShiftObserver.disconnect();
        };
      } catch (e) {
        console.error('Error setting up PerformanceObserver:', e);
      }
    }
    
    return () => {
      // Record component unmount time
      const unmountDuration = Date.now() - startTimeRef.current;
      
      // Report total lifecycle duration
      monitoringService.trackPerformance({
        type: metricType,
        name: `${id}_lifecycle`,
        value: unmountDuration,
      });
    };
  }, [id, metricType]);
  
  // This component doesn't render anything
  return null;
}

/**
 * Higher-order component that adds performance monitoring to a component
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  id: string,
  metricType?: MetricType
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    return (
      <div data-performance-id={id}>
        <PerformanceMonitor id={id} metricType={metricType} />
        <Component {...props} />
      </div>
    );
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return WrappedComponent;
}
