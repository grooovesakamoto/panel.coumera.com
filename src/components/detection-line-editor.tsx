"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Trash2, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Canvas from '@/components/canvas'

interface Point {
  x: number
  y: number
}

interface Line {
  id: string
  points: Point[]
  color: string
}

export interface DetectionLine {
  id: string
  name: string
  type: 'traffic' | 'entry'
  points: Point[]
}

interface DetectionLineEditorProps {
  deviceId: string
  imageUrl: string
  lines: DetectionLine[]
  onSave: (lines: DetectionLine[]) => void
  onLineComplete?: (points: Point[]) => void
  actId?: number
  className?: string
  hideControls?: boolean
}

export function DetectionLineEditor({ 
  deviceId, 
  imageUrl, 
  lines, 
  onSave,
  onLineComplete,
  actId = 9917,
  className,
  hideControls = false
}: DetectionLineEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [currentLine, setCurrentLine] = useState<Line | null>(null)
  const [savedLines, setSavedLines] = useState<Line[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  
  // 入店数(ID: 9918)は単一ラインのみ許可
  const isEntryCounter = actId === 9918;

  // 色のリスト
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF']

  // propsから渡されたラインを初期化
  useEffect(() => {
    if (lines && lines.length > 0) {
      const formattedLines: Line[] = lines.map((line, index) => ({
        id: line.id,
        points: line.points,
        color: colors[index % colors.length]
      }));
      
      setSavedLines(formattedLines);
    }
  }, [lines]);

  // キャンバスのサイズを画像に合わせる
  const updateCanvasSize = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (canvas && image) {
      canvas.width = image.width
      canvas.height = image.height
    }
  }

  // 線を描画
  const drawLine = (ctx: CanvasRenderingContext2D, line: Line, isSelected: boolean = false) => {
    if (line.points.length < 1) return

    ctx.beginPath()
    ctx.strokeStyle = line.color
    ctx.lineWidth = isSelected ? 3 : 2

    line.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })

    ctx.stroke()

    // 各点にマーカーを描画
    line.points.forEach((point, index) => {
      ctx.beginPath()
      ctx.fillStyle = line.color
      ctx.arc(point.x, point.y, isSelected ? 5 : 4, 0, Math.PI * 2)
      ctx.fill()
      
      // ポイント番号を表示
      if (isSelected) {
        ctx.fillStyle = 'white'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(index + 1), point.x, point.y)
      }
    })
  }

  // キャンバスを再描画
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 保存済みラインの描画
    savedLines.forEach(line => {
      const isSelected = line.id === selectedLineId
      drawLine(ctx, line, isSelected)
    })
    
    // 現在描画中のラインを描画
    if (currentLine) {
      drawLine(ctx, currentLine, true)
    }
  }

  // クリックイベントハンドラ
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setCurrentLine(prev => {
      if (!prev) return null
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      }
    })
  }

  // 新規ライン描画開始
  const handleStartDrawing = () => {
    // 入店数の場合、既にラインがあれば描画開始を許可しない
    if (isEntryCounter && savedLines.length > 0) {
      toast.error('入店数モードでは1本のラインのみ設定できます');
      return;
    }
    
    const newLineId = `line-${Date.now()}`
    const colorIndex = savedLines.length % colors.length
    
    setIsDrawing(true)
    setCurrentLine({ 
      id: newLineId, 
      points: [],
      color: colors[colorIndex]
    })
    setSelectedLineId(newLineId)
  }

  // ライン描画完了
  const handleCompleteDrawing = () => {
    if (!currentLine || currentLine.points.length < 2) {
      toast.error('少なくとも2点以上のポイントを設定してください')
      return
    }
    
    setIsDrawing(false)
    
    // 保存済みラインに追加
    setSavedLines(prev => [...prev, currentLine])
    
    // 親コンポーネントに通知
    if (onLineComplete) {
      onLineComplete(currentLine.points)
    }
    
    // 現在のラインをクリア
    setCurrentLine(null)
  }
  
  // ラインの選択
  const handleSelectLine = (lineId: string) => {
    setSelectedLineId(lineId)
  }
  
  // ラインの削除
  const handleDeleteLine = (lineId: string) => {
    setSavedLines(prev => prev.filter(line => line.id !== lineId))
    if (selectedLineId === lineId) {
      setSelectedLineId(null)
    }
  }
  
  // すべてのラインを保存
  const handleSaveAllLines = () => {
    if (savedLines.length === 0) {
      toast.error('保存するラインがありません')
      return
    }
    
    // 親コンポーネントのonSave関数に変換して渡す
    const detectionLines: DetectionLine[] = savedLines.map(line => ({
      id: line.id,
      name: `Line ${savedLines.indexOf(line) + 1}`,
      type: isEntryCounter ? 'entry' : 'traffic',
      points: line.points
    }))
    
    // 保存処理を実行
    onSave(detectionLines).then(() => {
      toast.success('すべてのラインを保存しました')
    }).catch(error => {
      toast.error('ラインの保存に失敗しました')
      console.error(error)
    })
  }

  // 画像読み込み時の処理
  useEffect(() => {
    const image = new Image()
    image.src = imageUrl
    image.onload = () => {
      imageRef.current = image
      updateCanvasSize()
      redrawCanvas()
    }
  }, [imageUrl])

  // 線の変更を監視して再描画
  useEffect(() => {
    redrawCanvas()
  }, [currentLine, savedLines, selectedLineId])

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt="検知ライン設定"
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <Canvas 
        deviceId={deviceId}
        lines={lines}
        drawMode={drawMode}
        selectedLineId={selectedLineId}
        onLineClick={handleLineClick}
        onLineComplete={handleCompleteDrawing}
      />
      
      {!hideControls && (
        <div className="absolute top-2 right-2">
          <Button
            variant="default"
            size="sm"
            className="mb-2 bg-cyan-500 hover:bg-cyan-600"
            onClick={handleStartDrawing}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            新規ライン
          </Button>
          {lines.length > 0 && (
            <Button
              variant="default"
              size="sm"
              className="mb-2 bg-cyan-500 hover:bg-cyan-600"
              onClick={handleSaveAllLines}
            >
              <Save className="mr-2 h-4 w-4" />
              すべて保存
            </Button>
          )}
        </div>
      )}
      
      {!hideControls && (
        <div className="absolute top-2 right-2">
          {!isDrawing ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleStartDrawing}
              disabled={isEntryCounter && savedLines.length > 0}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              {isEntryCounter ? 'ラインを描画' : '新規ライン'}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleCompleteDrawing}
              disabled={!currentLine || currentLine.points.length < 2}
            >
              描画完了
            </Button>
          )}
        </div>
      )}
      
      {!hideControls && (
        <div className="absolute top-2 right-2">
          {!isDrawing && savedLines.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">作成済みライン</p>
              <div className="max-h-40 overflow-y-auto">
                {savedLines.map((line, index) => (
                  <div 
                    key={line.id}
                    className={`flex items-center justify-between p-1 text-xs rounded my-1 ${selectedLineId === line.id ? 'bg-gray-200' : 'bg-white'}`}
                  >
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSelectLine(line.id)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }}></div>
                      <span>ライン {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteLine(line.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 