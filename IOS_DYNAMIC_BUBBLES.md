# Implementing Dynamic Resizing Navigation Bubbles in iOS

This guide demonstrates how to create a navigation interface where the "selection bubble" dynamically resizes to fit the text content of the selected item, similar to modern iOS segmented controls or message bubbles.

## Approach 1: SwiftUI (Recommended)

SwiftUI makes this incredibly easy using `matchedGeometryEffect`. This allows the "bubble" view to smoothly animate its frame to match the size and position of the selected text.

### The Code

```swift
import SwiftUI

struct DynamicNavView: View {
    // 1. Define your navigation items
    let tabs = ["Home", "My Projects", "Settings", "Profile"]
    
    // 2. Track the selected tab
    @State private var selectedTab = "Home"
    
    // 3. Namespace for the geometry effect
    @Namespace private var animation
    
    var body: some View {
        VStack {
            // Navigation Bar Container
            HStack(spacing: 0) {
                ForEach(tabs, id: \.self) { tab in
                    Button(action: {
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                            selectedTab = tab
                        }
                    }) {
                        Text(tab)
                            .font(.system(size: 16, weight: selectedTab == tab ? .semibold : .medium))
                            .foregroundColor(selectedTab == tab ? .white : .primary)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 20) // Dynamic width based on text length
                            .background(
                                ZStack {
                                    // 4. The Magic: Matched Geometry Effect
                                    if selectedTab == tab {
                                        RoundedRectangle(cornerRadius: 25)
                                            .fill(Color.blue)
                                            .matchedGeometryEffect(id: "BUBBLE", in: animation)
                                    }
                                }
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(6)
            .background(Color.gray.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 30))
            .padding()
            
            Spacer()
        }
    }
}

struct DynamicNavView_Previews: PreviewProvider {
    static var previews: some View {
        DynamicNavView()
    }
}
```

### Key Concepts Used:
1.  **`matchedGeometryEffect`**: This is the core magic. We declare a view (the blue bubble) that only exists *once* in the hierarchy, but we logically place it inside the `if selectedTab == tab` block. SwiftUI automatically interpolates the position and size (width/height) when the state changes.
2.  **`HStack`**: Automatically handles the "equal spacing" or natural flow of items. By using `.padding(.horizontal, 20)` on the Text itself, the button's tappable area and the visual bubble automatically resize to fit the text length.
3.  **`.spring()` animation**: Gives it that physical "iPhone" feel.

---

## Approach 2: UIKit (Classic)

In UIKit, this is harder. You need to use Auto Layout anchors or frames. The best approach is often a `UICollectionView` or a custom `UIStackView` where you calculate the frame of the selected label and animate a background `UIView` to that position.

### The Code

```swift
import UIKit

class DynamicNavViewController: UIViewController {
    
    // Data
    let items = ["Home", "My Projects", "Settings", "Profile"]
    
    // UI Elements
    let containerView = UIView()
    let stackView = UIStackView()
    let bubbleView = UIView()
    var buttons: [UIButton] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    func setupUI() {
        view.backgroundColor = .white
        
        // 1. Setup Container
        containerView.backgroundColor = UIColor.systemGray6
        containerView.layer.cornerRadius = 25
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)
        
        // 2. Setup Bubble (Selection Indicator)
        bubbleView.backgroundColor = .systemBlue
        bubbleView.layer.cornerRadius = 20
        // Important: We don't set constraints yet, we'll animate frames or use constraints dynamically
        containerView.addSubview(bubbleView)
        
        // 3. Setup StackView for Layout
        stackView.axis = .horizontal
        stackView.spacing = 5
        stackView.distribution = .fillProportionally // Or .fill to respect intrinsic size
        stackView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(stackView)
        
        // 4. Create Buttons
        for (index, title) in items.enumerated() {
            let button = UIButton()
            button.setTitle(title, for: .normal)
            button.setTitleColor(.black, for: .normal)
            button.setTitleColor(.white, for: .selected)
            button.titleLabel?.font = .systemFont(ofSize: 15, weight: .medium)
            // Add padding (intrinsic content size)
            button.configuration = UIButton.Configuration.plain()
            button.configuration?.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16)
            
            button.tag = index
            button.addTarget(self, action: #selector(tabTapped(_:)), for: .touchUpInside)
            
            stackView.addArrangedSubview(button)
            buttons.append(button)
        }
        
        // Constraints
        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            stackView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 4),
            stackView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -4),
            stackView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 4),
            stackView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -4)
        ])
        
        // Initial Selection
        DispatchQueue.main.async { // Wait for layout pass
            self.selectTab(at: 0, animated: false)
        }
    }
    
    @objc func tabTapped(_ sender: UIButton) {
        selectTab(at: sender.tag, animated: true)
    }
    
    func selectTab(at index: Int, animated: Bool) {
        let selectedButton = buttons[index]
        
        // Update Colors
        buttons.forEach { $0.isSelected = false }
        selectedButton.isSelected = true
        
        // Calculate Frame for Bubble
        // We need to convert the button's frame relative to the container view
        let targetFrame = selectedButton.convert(selectedButton.bounds, to: containerView)
        
        let animationBlock = {
            self.bubbleView.frame = targetFrame
        }
        
        if animated {
            UIView.animate(withDuration: 0.5, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: .curveEaseInOut) {
                animationBlock()
            }
        } else {
            animationBlock()
        }
    }
}
```

### Key Concepts Used:
1.  **`UIStackView`**: Manages the spacing and intrinsic sizing of the buttons automatically based on text length.
2.  **`convert(_:to:)`**: Crucial for UIKit. You take the bounds of the selected button (which is inside the stack view) and convert its coordinates to the `containerView` to know exactly where to place the floating `bubbleView`.
3.  **Frame Animation**: Unlike Auto Layout, animating the `frame` property of the `bubbleView` is often smoother and easier for this specific "floating" effect.

## Comparison

-   **SwiftUI**: Requires ~30 lines of code. Declarative. Handles resizing seamlessly via `matchedGeometryEffect`. **Start here.**
-   **UIKit**: Requires ~80+ lines of code. Imperative. Requires manual coordinate conversion and frame calculations. Use only if maintaining a legacy app.
