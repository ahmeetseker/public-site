import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DynamicIslandHeader } from '../dynamic-island-header'

const baseProps = {
  brandIcon: <span data-testid="brand-icon">★</span>,
  brandLabel: 'TestApp',
  navPages: [
    { key: 'home', alt: 'Home', icon: <span>H</span> },
    { key: 'about', alt: 'About', icon: <span>A</span> },
  ],
  subNav: {
    home: [
      { key: 'h1', label: 'Home Sub', icon: <span>·</span>, target: 'home', href: '/home/1' },
    ],
    about: [],
  },
}

describe('DynamicIslandHeader (generic)', () => {
  it('brand label render eder', () => {
    render(<DynamicIslandHeader {...baseProps} />)
    // Brand label may also surface in the status chip when activeKey doesn't
    // resolve, so use getAllByText to assert at least one occurrence.
    expect(screen.getAllByText('TestApp').length).toBeGreaterThan(0)
    expect(screen.getByTestId('brand-icon')).toBeInTheDocument()
  })

  it('pill tıklanınca nav grid açılır', () => {
    render(<DynamicIslandHeader {...baseProps} />)
    const pill = screen.getByRole('button', { name: /hızlı gezinme/i })
    fireEvent.click(pill)
    expect(screen.getByRole('dialog', { name: /hızlı gezinme/i })).toBeInTheDocument()
    // Accessible name concatenates icon text ("H") + label ("Home") → "HHome"
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
  })

  it('aiSearch prop yoksa AI search bloğunu render etmez', () => {
    render(<DynamicIslandHeader {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /hızlı gezinme/i }))
    expect(screen.queryByPlaceholderText(/ne arıyorsun/i)).not.toBeInTheDocument()
  })

  it('aiSearch prop varsa placeholder render eder', () => {
    render(
      <DynamicIslandHeader
        {...baseProps}
        aiSearch={{
          placeholder: 'Custom placeholder',
          suggestions: [],
          answerFn: () => ({ text: 'ok' }),
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /hızlı gezinme/i }))
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })

  it('subNav item tıklanınca onNavigateHref çağrılır', () => {
    const onNavigateHref = vi.fn()
    render(<DynamicIslandHeader {...baseProps} onNavigateHref={onNavigateHref} />)
    fireEvent.click(screen.getByRole('button', { name: /hızlı gezinme/i }))
    fireEvent.click(screen.getByRole('button', { name: /home/i }))
    fireEvent.click(screen.getByText('Home Sub'))
    expect(onNavigateHref).toHaveBeenCalledWith('/home/1')
  })

  it('notifications.unreadCount > 0 ise badge render eder', () => {
    render(
      <DynamicIslandHeader
        {...baseProps}
        notifications={{ unreadCount: 3, panel: <div /> }}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('notifications.panel function form called with close callback', () => {
    const panelFn = vi.fn().mockReturnValue(<div>panel content</div>)
    render(
      <DynamicIslandHeader
        {...baseProps}
        notifications={{ unreadCount: 0, panel: panelFn }}
      />,
    )
    fireEvent.click(screen.getByLabelText(/bildirimler/i))
    expect(panelFn).toHaveBeenCalledWith(
      expect.objectContaining({ close: expect.any(Function) }),
    )
  })

  it('onOpenAssistant verilmezse sparkle button render etmez', () => {
    render(<DynamicIslandHeader {...baseProps} />)
    expect(screen.queryByLabelText(/atölye asistanı|asistan/i)).not.toBeInTheDocument()
  })
})
